import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { ActionData } from '../index'
import {
  Client as TemporalClient,
  Connection as TemporalConnection,
} from '@temporalio/client'
import { createRunModule } from '../temporal/workflows'
import { createHash } from 'crypto'
import { v4 as uuid } from 'uuid'
import { CreateApiKeyService } from './ApiKeyService'

const PROJECT_ID = 'macro-coil-194519'

export interface CloudDataJobService {
  createJob(
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

  async function createJob(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ) {
    const address = process.env.NST_TEMPORAL_ADDRESS
    const connection = await TemporalConnection.connect({
      address,
      tls: false,
    })

    const client = new TemporalClient({
      connection,
    })

    console.log({ projectId })

    console.dir(data)
    const moduleName = data.data.module.id.split('#')[0]
    const version = data.data.module.version
    const args = data.data.args.slice(1)

    const actionId = actionPath.split('/').slice(-1)[0]
    const workflowId = `workflow-${actionId}`
    const taskQueue = `queue-${actionId}`

    const imageId = `gcr.io/${PROJECT_ID}/data-job-runner:latest`

    const apiKeyService = CreateApiKeyService({ firestore })

    const apiKey = await apiKeyService.createAndAddApiKey(projectId)
    if (!apiKey) throw new Error('failed to create temporary apiKey')
    // mark action as started
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })
    await asyncSpawn('gcloud', [
      'run',
      'jobs',
      'create',
      workflowId,
      '--memory=4Gi',
      `--image=${imageId}`,
      '--region=us-west1',
      `--set-env-vars=NSTRUMENTA_API_KEY=${apiKey},NST_TEMPORAL_ADDRESS=${address},TASK_QUEUE=${taskQueue}`,
    ])
    await asyncSpawn('gcloud', [
      'run',
      'jobs',
      'execute',
      workflowId,
      '--region=us-west1',
    ])

    const handle = await client.workflow.start(createRunModule, {
      args: [moduleName, version, args],
      taskQueue,
      workflowId,
    })
    console.log(`Started workflow ${handle.workflowId}`)

    console.log(await handle.result())

    //clean up execution
    const listExecutionsOutput = await asyncSpawn('gcloud', [
      'run',
      'jobs',
      'executions',
      'list',
      `--job=${workflowId}`,
      '--region=us-west1',
    ])

    if (listExecutionsOutput !== null) {
      const executionMatch = listExecutionsOutput.match(
        new RegExp(`${workflowId}-.....`),
      )
      if (executionMatch) {
        const exectutionId = executionMatch[0]
        await asyncSpawn('gcloud', [
          'run',
          'jobs',
          'executions',
          'delete',
          exectutionId,
          '--region=us-west1',
          '-q',
        ])
      }
    }

    //revoke temp apiKey
    apiKeyService.removeTempKey(apiKey)

    //mark action as complete
    await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
  }

  return {
    createJob,
  }
}