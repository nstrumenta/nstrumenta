import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'





export interface GetAgentIdByTagArgs {
  projectId: string
}

const getAgentIdByTagBase: APIEndpoint<GetAgentIdByTagArgs> = async (
  req,
  res,
  args,
) => {
  try {
    const { projectId } = args
    const { tag } = req.body
    const path = `projects/${projectId}/agents/`
    const machines = await firestore
      .collection(path)
      .where('tag', '==', tag)
      .get()
    return res
      .status(200)
      .send(machines.docs.map((doc: QueryDocumentSnapshot) => doc.id)[0])
  } catch (error) {
    return res.status(400).json({ error: 'Failed to get agent ID' })
  }
}

export const getAgentIdByTag = withAuth(getAgentIdByTagBase)
