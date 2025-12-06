import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface GetMachinesArgs {
  projectId: string
}

const getMachinesBase: APIEndpoint<GetMachinesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const projectMachinesPath = `/projects/${projectId}/machines`
    const machines = await firestore.collection(projectMachinesPath).get()
    const hosts = machines.docs.map((doc: QueryDocumentSnapshot) => doc.data())

    return res.status(200).send(hosts)
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching hosts`)
  }
}

export const getMachines = withAuth(getMachinesBase)
