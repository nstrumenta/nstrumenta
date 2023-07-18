import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'


export interface ClosePendingAgentActionsArgs {
  projectId: string
}

const closePendingAgentActionsBase: APIEndpoint<
  ClosePendingAgentActionsArgs
> = async (req, res, args) => {
  const { projectId } = args
  const { agentId } = req.body

  if (!agentId) {
    return res.status(404).send('agentId required')
  }

  try {
    const actionPath = `projects/${projectId}/agents/${agentId}/actions`
    const collection: FirebaseFirestore.CollectionReference =
      firestore.collection(actionPath)
    const actions = await collection.listDocuments()
    for await (const action of actions) {
      await action.get()
      await action.update({ status: 'canceled' })
    }

    return res.status(200).send()
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const closePendingAgentActions = withAuth(closePendingAgentActionsBase)
