import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface UpdateAgentArgs {
  projectId: string
}

export interface UpdateAgentBody {
  properties: Record<string, unknown>
  agentId?: string
  tag?: string
}

const updateAgentBase: APIEndpoint<UpdateAgentArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  const { agentId, tag, properties }: UpdateAgentBody = req.body
  console.log({ agentId, tag, properties, projectId })
  try {
    if (!agentId) {
      throw new Error('request body must specify one of tag or agentId')
    }
    const agentPath = `/projects/${projectId}/agents/${agentId}`

    await firestore.doc(agentPath).update(properties)

    return res.status(200).send(properties)
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error updating agent ${(error as Error).message}`)
  }
}

export const updateAgent = withAuth(updateAgentBase)
