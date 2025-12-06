import { v4 as uuid } from 'uuid'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface SetAgentActionArgs {
  projectId: string
}

export async function createAgentAction(projectId: string, agentId: string, action: any) {
  if (!agentId) {
    throw new Error('agentId required')
  }
  const actionPath = `projects/${projectId}/agents/${agentId}/actions`
  const actionId = uuid()
  await firestore
    .collection(actionPath)
    .doc(actionId)
    .create({ createdAt: Date.now(), lastModified: Date.now(), ...action })
  
  // Notify SSE clients about the new action
  try {
    const { notifyAgentActionsUpdate } = await import('../mcp.js')
    await notifyAgentActionsUpdate(projectId, agentId)
  } catch (error) {
    // Ignore notification errors
    console.warn('Failed to notify action update:', error)
  }
  
  return actionId
}

const setAgentActionBase: APIEndpoint<SetAgentActionArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  const { agentId, action } = req.body
  try {
    const actionId = await createAgentAction(projectId, agentId, action)
    return res.status(200).send(actionId)
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong', details: (error as Error).message })
  }
}

export const setAgentAction = withAuth(setAgentActionBase)
