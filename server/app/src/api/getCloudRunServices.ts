import { ServicesClient } from '@google-cloud/run'
import { APIEndpoint, withAuth } from '../authentication'
import { projectId } from '../authentication/ServiceAccount'

const REGION = 'us-west1'

export interface GetCloudRunServicesArgs {
  projectId: string
}

const servicesClient = new ServicesClient()

const getCloudRunServicesBase: APIEndpoint<GetCloudRunServicesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  try {
    const parent = `projects/${projectId}/locations/${REGION}`
    const [services] = await servicesClient.listServices({ parent })
    return res.status(200).send(JSON.stringify(services))
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching services`)
  }
}

export const getCloudRunServices = withAuth(getCloudRunServicesBase)
