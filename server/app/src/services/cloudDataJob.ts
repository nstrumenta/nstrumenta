import { Firestore } from '@google-cloud/firestore'
import { JobsClient, ExecutionsClient, ServicesClient } from '@google-cloud/run'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { cloudRegion, projectId as gcpProjectId } from '../authentication/ServiceAccount'
import {
  ActionData,
  nstrumentaImageRepository,
  nstrumentaImageVersionTag,
} from '../index'
import { CreateApiKeyService } from './ApiKeyService'

const REGION = cloudRegion

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
  firestore: Firestore
  spawn: (
    command: string,
    args: string[],
    options?: any,
  ) => ChildProcessWithoutNullStreams
  storage: Storage
}

export const createCloudDataJobService = ({
  firestore,
  spawn,
}: CloudDataJobServiceDependencies): CloudDataJobService => {
  const jobsClient = new JobsClient()
  const executionsClient = new ExecutionsClient()
  const servicesClient = new ServicesClient()

  async function localDockerRun(
    jobId: string,
    imageId: string,
    apiKey: string,
    actionPath: string,
    data: ActionData,
  ): Promise<void> {
    console.log(`starting local execution for ${jobId}`)
    const process = spawn('docker', [
      'run',
      '--rm',
      '--network',
      'nstrumenta_default',
      '-e',
      `NSTRUMENTA_API_KEY=${apiKey}`,
      '-e',
      `ACTION_PATH=${actionPath}`,
      '-e',
      `ACTION_DATA=${btoa(JSON.stringify(data))}`,
      imageId,
    ])

    let error = ''
    for await (const chunk of process.stderr) {
      error += chunk
    }
    const code: number = await new Promise((resolve) => {
      process.on('close', resolve)
    })
    if (code) {
      throw new Error(`docker run error code ${code}, ${error}`)
    }
  }

  async function createJob(
    actionPath: string,
    nstProjectId: string,
    data: ActionData,
  ) {
    console.log('create cloud run job', { nstProjectId, data })

    const actionId = actionPath.split('/').slice(-1)[0].toLowerCase()
    const jobId = `job-${Date.now()}-${actionId}`

    const imageId =
      data.data.image ||
      `${nstrumentaImageRepository}/data-job-runner:${nstrumentaImageVersionTag}`

    const apiKeyService = CreateApiKeyService({ firestore })

    const apiKey = await apiKeyService.createAndAddApiKey(nstProjectId)
    if (!apiKey) throw new Error('failed to create temporary apiKey')

    try {
      await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

      if (process.env.NSTRUMENTA_CLOUD_RUN_MODE === 'local') {
        await localDockerRun(jobId, imageId, apiKey.key, actionPath, data)
      } else {
        const parent = `projects/${gcpProjectId}/locations/${REGION}`
        const encodedActionData = btoa(JSON.stringify(data))

        console.log(`[cloudDataJob] creating job ${jobId} via Cloud Run API`)
        const [createOperation] = await jobsClient.createJob({
          parent,
          jobId,
          job: {
            template: {
              template: {
                maxRetries: 1,
                containers: [
                  {
                    image: imageId,
                    resources: {
                      limits: { cpu: '2', memory: '8Gi' },
                    },
                    env: [
                      { name: 'NSTRUMENTA_API_KEY', value: apiKey.key },
                      { name: 'ACTION_PATH', value: actionPath },
                      { name: 'ACTION_DATA', value: encodedActionData },
                    ],
                  },
                ],
              },
            },
            launchStage: 'GA',
          },
        })
        await createOperation.promise()

        console.log(`starting execution for ${jobId}`)
        const jobName = `${parent}/jobs/${jobId}`
        const [runOperation] = await jobsClient.runJob({ name: jobName })
        const [execution] = await runOperation.promise()

        if (execution?.name) {
          await waitForExecution(execution.name)
        }
      }

      console.log(`completed ${jobId}`)
      await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (error) {
      console.error(`Error in createJob for ${jobId}:`, error)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: String(error) }, { merge: true })
      if (process.env.CI || process.env.TEST_ID) {
        console.log('Test environment detected, exiting process')
        process.exit(1)
      }
    } finally {
      await apiKeyService.removeTempKey(apiKey.key)
    }
  }

  async function waitForExecution(executionName: string): Promise<void> {
    const pollIntervalMs = 10_000
    const maxWaitMs = 30 * 60_000
    const deadline = Date.now() + maxWaitMs

    while (Date.now() < deadline) {
      const [execution] = await executionsClient.getExecution({ name: executionName })
      const completionTime = execution.completionTime
      if (completionTime) {
        const failedCount = execution.failedCount ?? 0
        if (failedCount > 0) {
          throw new Error(`Cloud Run job execution failed: ${executionName}`)
        }
        return
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }
    throw new Error(`Cloud Run job execution timed out after ${maxWaitMs / 60_000} minutes: ${executionName}`)
  }

  async function createService(
    actionPath: string,
    nstProjectId: string,
    data: ActionData,
  ) {
    console.log('create cloud run service', { nstProjectId, data })

    const actionId = actionPath.split('/').slice(-1)[0].toLowerCase()
    const serviceId = `service-${Date.now()}-${actionId}`

    const { image, command, port } = data.data

    const apiKeyService = CreateApiKeyService({ firestore })

    const apiKey = await apiKeyService.createAndAddApiKey(nstProjectId)
    if (!apiKey) throw new Error('failed to create temporary apiKey')
    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

    const parent = `projects/${gcpProjectId}/locations/${REGION}`
    const encodedActionData = btoa(JSON.stringify(data))

    const commandArray = command ? command.split(' ') : []

    console.log(`[cloudDataJob] deploying service ${serviceId} via Cloud Run API`)
    const [operation] = await servicesClient.createService({
      parent,
      serviceId,
      service: {
        template: {
          containers: [
            {
              image,
              command: commandArray,
              ports: [{ containerPort: port ?? 8080 }],
              env: [
                { name: 'NSTRUMENTA_API_KEY', value: apiKey.key },
                { name: 'ACTION_PATH', value: actionPath },
                { name: 'ACTION_DATA', value: encodedActionData },
              ],
            },
          ],
        },
      },
    })
    await operation.promise()

    // Allow unauthenticated access
    await servicesClient.setIamPolicy({
      resource: `${parent}/services/${serviceId}`,
      policy: {
        bindings: [
          {
            role: 'roles/run.invoker',
            members: ['allUsers'],
          },
        ],
      },
    })

    console.log(`started ${serviceId}`)
    await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
  }

  return {
    createService,
    createJob,
  }
}
