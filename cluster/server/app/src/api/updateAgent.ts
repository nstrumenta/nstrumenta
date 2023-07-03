import { Firestore, FieldValue, QuerySnapshot } from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'
import { getAgentIdByTag } from './getAgentIdByTagBase'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))
// @ts-ignore
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

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
