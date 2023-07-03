import { Firestore, QueryDocumentSnapshot } from '@google-cloud/firestore'
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
