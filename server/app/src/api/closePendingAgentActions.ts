import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'


export interface ClosePendingAgentActionsArgs {
  projectId: string
}

export async function cancelAgentActions(projectId: string, agentId: string) {
  if (!agentId) {
    throw new Error('agentId required')
  }

  const actionPath = `projects/${projectId}/agents/${agentId}/actions`
  const collection: FirebaseFirestore.CollectionReference =
    firestore.collection(actionPath)
  const actions = await collection.listDocuments()
  for await (const action of actions) {
    await action.get()
    await action.update({ status: 'canceled' })
  }
}

const closePendingAgentActionsBase: APIEndpoint<
  ClosePendingAgentActionsArgs
> = async (req, res, args) => {
  const { projectId } = args
  const { agentId } = req.body

  try {
    await cancelAgentActions(projectId, agentId)
    return res.status(200).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to close pending actions' })
  }
}

export const closePendingAgentActions = withAuth(closePendingAgentActionsBase)
