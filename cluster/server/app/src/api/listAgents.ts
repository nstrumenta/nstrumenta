import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface ListAgentsArgs {
  projectId: string
}

const listAgentsBase: APIEndpoint<ListAgentsArgs> = async (req, res, args) => {
  const { projectId } = args
  try {
    const path = `projects/${projectId}/agents/`
    const machines = await firestore.collection(path).get()
    const agents = machines.docs.map((doc: QueryDocumentSnapshot) => [
      doc.id,
      doc.data(),
    ])
    console.log(agents)

    return res.status(200).send(agents)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listAgents = withAuth(listAgentsBase)
