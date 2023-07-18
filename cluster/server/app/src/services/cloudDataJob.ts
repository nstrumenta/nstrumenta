import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { writeFile } from 'fs/promises'
import { serviceAccount } from '../authentication/ServiceAccount'
import { ActionData } from '../index'
import { CreateApiKeyService } from './ApiKeyService'

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
    console.log({ projectId })

    const actionId = actionPath.split('/').slice(-1)[0]
    const workflowId = `workflow-${actionId}`

    const imageId = `gcr.io/${serviceAccount.project_id}/data-job-runner:latest`

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
      'jobs',
      'create',
      workflowId,
      '--memory=4Gi',
      `--image=${imageId}`,
      '--region=us-west1',
      `--set-env-vars=NSTRUMENTA_API_KEY=${apiKey},NSTRUMENTA_API_URL=${
        process.env.NSTRUMENTA_API_URL
      },ACTION_PATH=${actionPath},ACTION_DATA=${btoa(JSON.stringify(data))}`,
    ])
    await asyncSpawn('gcloud', [
      'run',
      'jobs',
      'execute',
      workflowId,
      '--region=us-west1',
    ])

    console.log(`started ${workflowId}`)

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
        const executionId = executionMatch[0]
        // watch for status
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(async () => {
            const description = JSON.parse(
              await asyncSpawn(
                'gcloud',
                [
                  'run',
                  'jobs',
                  'executions',
                  'describe',
                  executionId,
                  '--region=us-west1',
                  '--format="json"',
                ],
                { quiet: true },
              ),
            )
            const message = description.status.conditions[0].message
            if (!message?.startsWith('Waiting')) {
              console.log(
                `${executionId} ${
                  message ?? JSON.stringify(description.status)
                }`,
              )
              clearInterval(interval)
              resolve()
            }
          }, 500)
          setTimeout(async () => {
            clearInterval(interval)
            await asyncSpawn('gcloud', [
              'run',
              'jobs',
              'executions',
              'delete',
              executionId,
              '--region=us-west1',
              '-q',
            ])
            reject(new Error(`timeout on ${workflowId} ${executionId}`))
          }, 60 * 60_000)
        })
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
