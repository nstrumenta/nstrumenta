import { Firestore } from '@google-cloud/firestore'
import { ServicesClient } from '@google-cloud/run'
import { cloudRegion, projectId as gcpProjectId } from '../authentication/ServiceAccount'
import { ActionData } from '../types'
import { CreateApiKeyService } from './ApiKeyService'

const REGION = cloudRegion

export interface CloudDataJobService {
  createService(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
}

export interface CloudDataJobServiceDependencies {
  firestore: Firestore
}

export const createCloudDataJobService = ({
  firestore,
}: CloudDataJobServiceDependencies): CloudDataJobService => {
  const servicesClient = new ServicesClient()

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
  }
}
