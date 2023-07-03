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
    return res.status(400).send((error as Error).message)
  }
}

export const getAgentIdByTag = withAuth(getAgentIdByTagBase)
