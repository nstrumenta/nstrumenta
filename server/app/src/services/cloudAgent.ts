import { Firestore } from '@google-cloud/firestore'
import { ServicesClient } from '@google-cloud/run'
import { Storage } from '@google-cloud/storage'
import { projectId } from '../authentication/ServiceAccount'
import {
  ActionData,
  nstrumentaImageRepository,
  nstrumentaImageVersionTag,
} from '../index'
import { ApiKeyService } from './ApiKeyService'

const REGION = 'us-west1'

const buildResourceName = (actionPath: string) => {
  const projectId = actionPath.split('/')[1]
  const actionId = actionPath.split('/')[3]
  return `${projectId}-${actionId}`
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^-a-z0-9]/, '')
    .slice(0, 61)
}

export interface CloudAgentServiceDependencies {
  firestore: Firestore
  storage: Storage
}

export interface CloudAgentService {
  deployCloudAgent(
    actionPath: string,
    data: ActionData,
    apiKeyService: ApiKeyService,
  ): Promise<void>

  deleteDeployedCloudAgent(actionPath: string, data: ActionData): Promise<void>
}

export const createCloudAgentService = ({
  firestore,
}: CloudAgentServiceDependencies): CloudAgentService => {
  const servicesClient = new ServicesClient()

  async function deployCloudAgent(
    actionPath: string,
    data: { payload: { projectId: string } },
    apiKeyService: ApiKeyService,
  ) {
    const {
      payload: { projectId: nstProjectId },
    } = data

    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

    const instanceId = buildResourceName(actionPath)
    const imageId = `${nstrumentaImageRepository}/agent:${nstrumentaImageVersionTag}`

    console.log({ nstProjectId })
    const apiKey = await apiKeyService.createAndAddApiKey(nstProjectId)
    try {
      console.log('[cloudAgent] deploying via Cloud Run API')
      if (!apiKey)
        throw new Error('api key not set, unable to createCloudAgent')

      const parent = `projects/${projectId}/locations/${REGION}`

      const [operation] = await servicesClient.createService({
        parent,
        serviceId: instanceId,
        service: {
          template: {
            containers: [
              {
                image: imageId,
                ports: [{ containerPort: 8088 }],
                env: [
                  { name: 'PROJECT_ID', value: nstProjectId },
                  { name: 'HOST_INSTANCE_ID', value: instanceId },
                  { name: 'NSTRUMENTA_API_KEY', value: apiKey.key },
                ],
              },
            ],
            scaling: {
              minInstanceCount: 1,
              maxInstanceCount: 1,
            },
            timeout: { seconds: 3600 },
          },
        },
      })

      const [service] = await operation.promise()

      // Allow unauthenticated access
      await servicesClient.setIamPolicy({
        resource: `projects/${projectId}/locations/${REGION}/services/${instanceId}`,
        policy: {
          bindings: [
            {
              role: 'roles/run.invoker',
              members: ['allUsers'],
            },
          ],
        },
      })

      const machinePath = `projects/${nstProjectId}/machines/${instanceId}`
      await firestore.doc(machinePath).set(service)
      await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (err: any) {
      console.log(`failed to deploy cloudAgent ${err.message}`)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: err.message }, { merge: true })
    }
  }

  async function deleteDeployedCloudAgent(
    actionPath: string,
    data: { payload: { projectId: string; instanceId: string } },
  ) {
    console.log('deleteDeployedCloudAgent', data)
    const {
      payload: { projectId: nstProjectId, instanceId },
    } = data

    await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })
    const machineDocPath = `projects/${nstProjectId}/machines/${instanceId}`

    try {
      const name = `projects/${projectId}/locations/${REGION}/services/${instanceId}`
      const [operation] = await servicesClient.deleteService({ name })
      await operation.promise()

      await firestore.doc(machineDocPath).set({ deleted: true }, { merge: true })
      await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (err) {
      const error = (err as Error)?.message ?? JSON.stringify(err)
      console.log(error)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error }, { merge: true })
    }
  }

  return {
    deployCloudAgent,
    deleteDeployedCloudAgent,
  }
}
