import { Firestore } from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'

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
