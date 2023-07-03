import fs from 'fs'
import { Firestore } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'

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

export interface ListObjectsArgs {
  projectId: string
}

export interface ListObjectsOptions {
  type: string
}

const sanitizeString = (str: string) => {
  const badCharacters = /[\/]/
  if (Boolean(badCharacters.exec(str))) {
    throw new Error('No forward slashes allowed in object names')
  }
  return str.trim()
}

async function getDocs(path: string) {
  const collection = firestore.collection(path)
  const docRefs = await collection.listDocuments()
  const dataPromises = docRefs.map(async (docRef) => {
    const doc = await docRef.get()
    const data = doc.data()
    const id = doc.id
    return { id, data }
  })
  const objects = await Promise.all(dataPromises)
  return objects
}

const listStorageObjectsBase: APIEndpoint<ListObjectsArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  const { type: originalType }: ListObjectsOptions = req.body

  try {
    const type = sanitizeString(originalType)
    console.log({ projectId, type })
    const projectPath = `projects/${projectId}`
    const path = `${projectPath}/${type}`
    const objects = await getDocs(path)

    return res.status(200).send(objects)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listStorageObjects = withAuth(listStorageObjectsBase)
