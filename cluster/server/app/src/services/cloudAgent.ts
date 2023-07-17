import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { serviceAccount } from '../authentication/ServiceAccount'
import { ActionData } from '../index'
import { ApiKeyService } from './ApiKeyService'

const buildResourceName = (actionPath: string) => {
  const projectId = actionPath.split('/')[1]
  const actionId = actionPath.split('/')[3]
  return `${projectId}-${actionId}`
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^-a-z0-9]/, '')
    .slice(0, 61)
}

export interface CloudAgentVMMetaData {
  createdAt: string
  ipAddress: string
}

export interface CloudAgentServiceDependencies {
  firestore: Firestore
  compute: any
  spawn: (
    command: string,
    args: string[],
    options?: any,
  ) => ChildProcessWithoutNullStreams
  timeout?: number
  storage: Storage
}

interface CreateVMArgs {
  projectId: string
  apiKey: string
  instanceId: string
  imageId: string
}

interface PushImageArgs {
  imageId: string
}

interface StoreTarballArgs {
  actionPath: string
  imageId: string
}
export interface CloudAgentService {
  deployCloudAgent(
    actionPath: string,
    data: ActionData,
    apiKeyService: ApiKeyService,
  ): Promise<void>

  deleteDeployedCloudAgent(actionPath: string, data: ActionData): Promise<void>
}

export interface GCloudDescribeResults {
  networkInterfaces: [
    { accessConfigs: [{ natIP: string; [key: string]: unknown }] },
  ]
  creationTimestamp: string
  status: string

  [key: string]: unknown
}

export const createCloudAgentService = ({
  firestore,
  spawn,
  storage,
}: CloudAgentServiceDependencies): CloudAgentService => {
  async function asyncSpawn(
    cmd: string,
    args?: string[],
    options?: { cwd?: string },
    errCB?: (code: number) => void,
  ) {
    console.log(`spawn [${cmd} ${args?.join(' ')}]`)
    const process = spawn(cmd, args || [], options)

    let output = ''
    for await (const chunk of process.stdout) {
      output += chunk
    }
    let error = ''
    for await (const chunk of process.stderr) {
      error += chunk
    }
    const code: number = await new Promise((resolve) => {
      process.on('close', resolve)
    })
    if (code) {
      if (errCB) {
        errCB(code)
      }

      throw new Error(`spawned process ${cmd} error code ${code}, ${error}`)
    }

    console.log(`spawn ${cmd} output ${output} ${error}`)
    return output
  }

  async function cloudRunDeployCloudAgent({
    projectId,
    instanceId,
    imageId,
    apiKey,
  }: CreateVMArgs) {
    await asyncSpawn(
      'gcloud',
      `config set core/project ${serviceAccount.project_id}`.split(' '),
    )

    await asyncSpawn('gcloud', `config set run/region europe-west3`.split(' '))

    await asyncSpawn('gcloud', [
      'run',
      'deploy',
      `${instanceId}`,
      `--image=${imageId}`,
      '--allow-unauthenticated',
      '--port=8088',
      `--service-account=${serviceAccount.client_email}`,
      '--max-instances=1',
      '--no-cpu-throttling',
      `--set-env-vars=PROJECT_ID=${projectId},HOST_INSTANCE_ID=${instanceId},NSTRUMENTA_API_KEY=${apiKey},NSTRUMENTA_API_URL${process.env.NSTRUMENTA_API_URL}`,
    ])

    const description = JSON.parse(
      await asyncSpawn(
        'gcloud',
        `run services describe ${instanceId} --format=json`.split(' '),
      ),
    )

    return description
  }

  async function deployCloudAgent(
    actionPath: string,
    data: { payload: { projectId: string } },
    apiKeyService: ApiKeyService,
  ) {
    const {
      payload: { projectId },
    } = data

    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

    const instanceId = buildResourceName(actionPath)
    const gcpProjectId = serviceAccount.project_id
    const imageId = `gcr.io/${gcpProjectId}/agent:latest`

    //create apiKey specifically for the cloud agent
    const apiKey = await apiKeyService.createAndAddApiKey(projectId)
    let description: GCloudDescribeResults | undefined = undefined
    try {
      console.log('[sandbox] invoke createCloudAgent')
      if (!apiKey)
        throw new Error('api key not set, unable to createCloudAgent')

      description = await cloudRunDeployCloudAgent({
        instanceId,
        apiKey,
        imageId,
        projectId,
      })
    } catch (err: any) {
      console.log(`failed to deploy sandbox ${err.message}`)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: err.message }, { merge: true })
    }
    const machinePath = `projects/${projectId}/machines/${instanceId}`

    try {
      if (description) {
        firestore.doc(machinePath).set(description)
      }
      firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (err) {
      firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
    }
  }

  async function deleteDeployedCloudAgent(
    actionPath: string,
    data: { payload: { projectId: string; instanceId: string } },
  ) {
    console.log('deleteDeployedCloudAgent', data)
    const {
      payload: { projectId, instanceId },
    } = data

    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })
    const machineDocPath = `projects/${projectId}/machines/${instanceId}`

    try {
      await asyncSpawn(
        'gcloud',
        `config set run/region europe-west3`.split(' '),
      )
      await asyncSpawn('gcloud', 'config set disable_prompts true'.split(' '))
      await asyncSpawn('gcloud', ['run', 'services', 'delete', `${instanceId}`])

      await firestore
        .doc(machineDocPath)
        .set({ deleted: true }, { merge: true })
      await firestore
        .doc(actionPath)
        .set({ status: 'complete' }, { merge: true })
    } catch (err) {
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
    }
  }

  return {
    deployCloudAgent,
    deleteDeployedCloudAgent,
  }
}
