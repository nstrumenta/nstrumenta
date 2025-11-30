import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface GetActionArgs {
  projectId: string
}

const getActionBase: APIEndpoint<GetActionArgs> = async (req, res, args) => {
  const { projectId } = args
  const { actionId } = req.body
  try {
    const actionPath = `projects/${projectId}/actions/${actionId}`
    const doc = await firestore.doc(actionPath).get()
    if (!doc.exists) {
      return res.status(404).send('Action not found')
    }
    return res.status(200).send(doc.data())
  } catch (error) {
    res.status(500).send(`Something went wrong: ${(error as Error).message}`)
  }
}

export const getAction = withAuth(getActionBase)
