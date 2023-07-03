import { Firestore, QueryDocumentSnapshot } from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'

let PROJECT_HOST_MACHINE_COLLECTION_KEY = 'machines'

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

export interface GetMachinesArgs {
  projectId: string
}

const getMachinesBase: APIEndpoint<GetMachinesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const projectMachinesPath = `/projects/${projectId}/${PROJECT_HOST_MACHINE_COLLECTION_KEY}`
    const machines = await firestore.collection(projectMachinesPath).get()
    const hosts = machines.docs.map((doc: QueryDocumentSnapshot) => doc.data())

    return res.status(200).send(hosts)
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching hosts`)
  }
}

export const getMachines = withAuth(getMachinesBase)
