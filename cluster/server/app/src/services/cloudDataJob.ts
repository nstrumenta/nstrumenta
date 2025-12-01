import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { writeFile } from 'fs/promises'
import { serviceAccount } from '../authentication/ServiceAccount'
import {
  ActionData,
  nstrumentaImageRepository,
  nstrumentaImageVersionTag,
} from '../index'
import { CreateApiKeyService } from './ApiKeyService'

export interface CloudDataJobService {
  createJob(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
  createService(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
}

export interface CloudDataJobServiceDependencies {
  compute: any
  firestore: Firestore
  spawn: (
    command: string,
    args: string[],
    options?: any,
  ) => ChildProcessWithoutNullStreams
  timeout?: number
  storage: Storage
}

export const createCloudDataJobService = ({
  firestore,
  spawn,
  storage,
}: CloudDataJobServiceDependencies): CloudDataJobService => {
  async function asyncSpawn(
    cmd: string,
    args?: string[],
    options?: { cwd?: string; quiet?: boolean },
    errCB?: (code: number) => void,
  ) {
    if (!options?.quiet) console.log(`${cmd} ${args?.join(' ')}`)
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
    if (!options?.quiet) {
      console.log(`${cmd} ${args?.join(' ')}`, output, error)
    }
    return output
  }

  async function createJob(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ) {
    console.log('create cloud run job', { projectId, data })

    const actionId = actionPath.split('/').slice(-1)[0].toLowerCase()
    const jobId = `job-${Date.now()}-${actionId}`

    const imageId =
      data.data.image ||
      `${nstrumentaImageRepository}/data-job-runner:${nstrumentaImageVersionTag}`

    const apiKeyService = CreateApiKeyService({ firestore })

    const apiKey = await apiKeyService.createAndAddApiKey(projectId)
    if (!apiKey) throw new Error('failed to create temporary apiKey')

    try {
      // mark action as started
      await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })
      const keyfile = './credentials.json'
      await writeFile(keyfile, JSON.stringify(serviceAccount), 'utf-8')
      await asyncSpawn(
        'gcloud',
        `auth activate-service-account --key-file ${keyfile}`.split(' '),
      )
      await asyncSpawn(
        'gcloud',
        `config set core/project ${serviceAccount.project_id}`.split(' '),
      )
      // could use the region for the firebase project
      if (process.env.NSTRUMENTA_CLOUD_RUN_MODE === 'local') {
        console.log(`starting local execution for ${jobId}`)
        const args = [
          'run',
          '--rm',
          '--network',
          'cluster_default',
          '-e',
          `NSTRUMENTA_API_KEY=${apiKey.key}`,
          '-e',
          `ACTION_PATH=${actionPath}`,
          '-e',
          `ACTION_DATA=${btoa(JSON.stringify(data))}`,
          imageId,
        ]
        await asyncSpawn('docker', args)
      } else {
        await asyncSpawn('gcloud', [
          'run',
          'jobs',
          'create',
          jobId,
          '--cpu=2',
          '--memory=8Gi',
          `--image=${imageId}`,
          '--region=us-west1',
          '--execution-environment=gen2',
          `--set-secrets=GCLOUD_SERVICE_KEY=GCLOUD_SERVICE_KEY:latest`,
          `--max-retries=1`,
          `--set-env-vars=NSTRUMENTA_API_KEY=${apiKey.key},ACTION_PATH=${actionPath},ACTION_DATA=${btoa(
            JSON.stringify(data),
          )}`,
        ])

        console.log(`starting execution for ${jobId}`)

        await asyncSpawn('gcloud', [
          'run',
          'jobs',
          'execute',
          jobId,
          '--region=us-west1',
          '--wait',
        ])
      }

      console.log(`completed ${jobId}`)

      //mark action as complete
      await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (error) {
      console.error(`Error in createJob for ${jobId}:`, error)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: String(error) }, { merge: true })
    } finally {
      //revoke temp apiKey
      await apiKeyService.removeTempKey(apiKey.key)
    }
  }

  async function createService(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ) {
    console.log('create cloud run job', { projectId, data })

    const actionId = actionPath.split('/').slice(-1)[0].toLowerCase()
    const serviceId = `service-${Date.now()}-${actionId}`

    const { image, command, port } = data.data

    const apiKeyService = CreateApiKeyService({ firestore })

    const apiKey = await apiKeyService.createAndAddApiKey(projectId)
    if (!apiKey) throw new Error('failed to create temporary apiKey')
    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })
    const keyfile = './credentials.json'
    await writeFile(keyfile, JSON.stringify(serviceAccount), 'utf-8')
    await asyncSpawn(
      'gcloud',
      `auth activate-service-account --key-file ${keyfile}`.split(' '),
    )
    await asyncSpawn(
      'gcloud',
      `config set core/project ${serviceAccount.project_id}`.split(' '),
    )
    // could use the region for the firebase project
    await asyncSpawn('gcloud', [
      'run',
      'deploy',
      serviceId,
      `--image=${image}`,
      `--command=${command.split(' ').join(',') ?? ''}`,
      `--port=${port ?? 8080}`,
      `--allow-unauthenticated`,
      '--region=us-west1',
      `--set-secrets=GCLOUD_SERVICE_KEY=GCLOUD_SERVICE_KEY:latest`,
      `--set-env-vars=NSTRUMENTA_API_KEY=${apiKey.key},ACTION_PATH=${actionPath},ACTION_DATA=${btoa(
        JSON.stringify(data),
      )}`,
    ])

    console.log(`started ${serviceId}`)

    //mark action as complete
    await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
  }

  return {
    createService,
    createJob,
  }
}
