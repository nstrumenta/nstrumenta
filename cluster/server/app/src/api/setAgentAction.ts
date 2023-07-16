import { v4 as uuid } from 'uuid'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface SetAgentActionArgs {
  projectId: string
}

const setAgentActionBase: APIEndpoint<SetAgentActionArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  const { agentId, action } = req.body
  try {
    if (!agentId) {
      throw new Error('agentId or tag required')
    }
    const actionPath = `projects/${projectId}/agents/${agentId}/actions`
    const actionId = uuid()
    await firestore
      .collection(actionPath)
      .doc(actionId)
      .create({ createdAt: Date.now(), lastModified: Date.now(), ...action })

    return res.status(200).send(actionId)
  } catch (error) {
    res.status(500).send(`Something went wrong: ${(error as Error).message}`)
  }
}

export const setAgentAction = withAuth(setAgentActionBase)
