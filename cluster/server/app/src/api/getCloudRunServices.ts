import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface GetCloudRunServicesArgs {
  projectId: string
}

const getCloudRunServicesBase: APIEndpoint<GetCloudRunServicesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const projectServicesPath = `/projects/${projectId}/services`
    const services = await firestore.collection(projectServicesPath).get()
    const hosts = services.docs.map((doc: QueryDocumentSnapshot) => doc.data())

    return res.status(200).send(hosts)
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching hosts`)
  }
}

export const getCloudRunServices = withAuth(getCloudRunServicesBase)
