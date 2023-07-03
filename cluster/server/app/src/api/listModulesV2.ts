import fs from 'fs'
import { Firestore } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { ListModulesArgs } from './types'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

const listModulesV2Base: APIEndpoint<ListModulesArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  try {
    const path = `projects/${projectId}/modules/`

    const collection = firestore.collection(path)
    const docRefs = await collection.listDocuments()
    const modulePromises = docRefs.map(async (docRef) => {
      const doc = await docRef.get()
      // TODO: add options for verbose version info
      return { id: doc.id, metadata: doc.data() }
    })
    const modules = await Promise.all(modulePromises)
    console.log(modules)

    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModulesV2 = withAuth(listModulesV2Base)
