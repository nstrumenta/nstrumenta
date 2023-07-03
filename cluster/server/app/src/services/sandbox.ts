import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { ActionData } from '../index'
import { ApiKeyService } from './ApiKeyService'

const PROJECT_HOST_MACHINE_COLLECTION_ID = 'machines'

const PROJECT_ID = process.env.NSTRUMENTA_GCP_PROJECT

const buildResourceName = (actionPath: string) => {
  const projectId = actionPath.split('/')[1]
  const actionId = actionPath.split('/')[3]
  return `${projectId}-${actionId}`
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^-a-z0-9]/, '')
    .substr(0, 61)
}

function parseCreateVMResults(results: GCloudDescribeResults) {
  const {
    networkInterfaces: [
      {
        accessConfigs: [{ natIP: ipAddress }],
      },
    ],
    name,
    creationTimestamp: createdAt,
    status,
  } = results

  const url = `https://${name}.vm.nstrumenta.com`
  const wsUrl = `wss://${name}.vm.nstrumenta.com`
  return {
    name,
    url,
    wsUrl,
    createdAt,
    status,
  }
}

export interface SandboxVMMetaData {
  createdAt: string
  ipAddress: string
}

export interface SandboxServiceDependencies {
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
  actionPath: string
  imageId: string
  machineType: string
}

interface PushImageArgs {
  imageId: string
}

interface StoreTarballArgs {
  actionPath: string
  imageId: string
}
export interface SandboxService {
  deploySandbox(
    actionPath: string,
    data: ActionData,
    apiKeyService: ApiKeyService,
  ): Promise<void>

  deleteDeployedSandbox(actionPath: string, data: ActionData): Promise<void>

  stopDeployedSandbox(actionPath: string, data: ActionData): Promise<void>

  updateProject(path: string, data: ActionData): Promise<void>
}

export interface GCloudDescribeResults {
  networkInterfaces: [
    { accessConfigs: [{ natIP: string; [key: string]: unknown }] },
  ]
  creationTimestamp: string
  status: string

  [key: string]: unknown
}

export const createSandboxService = ({
  firestore,
  spawn,
  storage,
}: SandboxServiceDependencies): SandboxService => {
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

    console.log(`spawn ${cmd} output ${output}`)
    return output
  }

  async function createVM({
    projectId,
    actionPath,
    imageId,
    apiKey,
    machineType,
  }: CreateVMArgs) {
    const hostInstanceId = buildResourceName(actionPath)

    const results = await asyncSpawn('gcloud', [
      'beta',
      'compute',
      'instances',
      'create-with-container',
      `${hostInstanceId}`,
      `--container-image=${imageId}`,
      '--zone',
      'us-west1-a',
      '--format=json',
      `--machine-type=${machineType}`,
      `--container-env=PROJECT_ID=${projectId},HOST_INSTANCE_ID=${hostInstanceId},NSTRUMENTA_API_KEY=${apiKey}`,
    ])

    console.log('compute instance created')

    return JSON.parse(results)[0]
  }

  async function deploySandbox(
    actionPath: string,
    data: { payload: { projectId: string; machineType?: string } },
    apiKeyService: ApiKeyService,
  ) {
    const {
      payload: { projectId, machineType },
    } = data

    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

    const imageId = `gcr.io/${PROJECT_ID}/hosted-vm:latest`

    //create apiKey
    const apiKey = await apiKeyService.createAndAddApiKey(projectId)

    try {
      console.log('[sandbox] invoke createVM')
      if (!apiKey) throw new Error('api key not set, unable to createVM')
      const vm = await createVM({
        actionPath,
        apiKey,
        imageId,
        projectId,
        machineType: machineType || '',
      })

      console.log(`set action ${actionPath} to deployed`, vm)
      await firestore.doc(actionPath).set(
        {
          status: 'deployed',
          vm,
        },
        {
          merge: true,
        },
      )
    } catch (err: any) {
      console.log(`failed to deploy sandbox ${err.message}`)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: err.message }, { merge: true })
    }
  }

  async function deleteDeployedSandbox(
    actionPath: string,
    data: { payload: { projectId: string; hostInstanceMachineId: string } },
  ) {
    console.log('deleteDeployedSandbox', data)
    const {
      payload: { projectId, hostInstanceMachineId },
    } = data

    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

    try {
      const metaPath = `projects/${projectId}/${PROJECT_HOST_MACHINE_COLLECTION_ID}/${hostInstanceMachineId}`

      const meta = await (await firestore.doc(metaPath).get()).data()

      if (meta?.status != 'stopped') {
        await stopDeployedSandbox(actionPath, data)
      }

      //remove machine from project
      await firestore.doc(metaPath).delete()

      await firestore
        .doc(actionPath)
        .set({ status: 'complete' }, { merge: true })
    } catch (err) {
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
    }
  }

  async function stopDeployedSandbox(
    actionPath: string,
    data: { payload: { projectId: string; hostInstanceMachineId: string } },
  ) {
    console.log('stopDeployedSandbox', data)
    const {
      payload: { projectId, hostInstanceMachineId },
    } = data

    try {
      const metaPath = `projects/${projectId}/${PROJECT_HOST_MACHINE_COLLECTION_ID}/${hostInstanceMachineId}`
      const status = await (await firestore.doc(metaPath).get()).data()?.status

      if (status == 'stopped') {
        throw `${hostInstanceMachineId} already stopped`
      }

      const results = await asyncSpawn('gcloud', [
        'compute',
        'instances',
        'delete',
        `${hostInstanceMachineId}`,
        '-q',
        '--zone',
        'us-west1-a',
      ])
      console.log(results)
      //set status to stopped
      await firestore.doc(metaPath).set({ status: 'stopped' }, { merge: true })

      await firestore
        .doc(actionPath)
        .set({ status: 'complete' }, { merge: true })
    } catch (err) {
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
    }
  }

  // This sort of thing might feel better in some sort of project service, but it's ok
  async function updateProject(
    actionPath: string,
    data: {
      payload: { projectId: string; hostInstanceMachineId: string }
      vm: GCloudDescribeResults
    },
  ) {
    const {
      payload: { projectId },
      vm,
    } = data
    const { name: hostInstanceId } = vm
    const machinePath = `${PROJECT_HOST_MACHINE_COLLECTION_ID}/${hostInstanceId}`

    const metaPath = `projects/${projectId}/${PROJECT_HOST_MACHINE_COLLECTION_ID}/${hostInstanceId}`
    const machineDoc = { projectId, metaPath, vm }
    try {
      firestore.doc(machinePath).set(machineDoc)
      firestore.doc(metaPath).set({ ...parseCreateVMResults(vm) })
      firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (err) {
      firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
    }
  }

  return {
    deploySandbox,
    deleteDeployedSandbox,
    stopDeployedSandbox,
    updateProject,
  }
}
