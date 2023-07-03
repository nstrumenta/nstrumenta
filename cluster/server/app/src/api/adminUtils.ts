import {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'
import { Storage } from '@google-cloud/storage'

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

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})
const bucketName = `${serviceAccount.project_id}.appspot.com`
const bucket = storage.bucket(bucketName)

export interface AdminUtilsArgs {
  projectId: string
}

const adminUtilsBase: APIEndpoint<AdminUtilsArgs> = async (req, res, args) => {
  const { projectId } = args
  const { name } = req.body
  console.log(req.body)
  if (!name) return res.status(404).send('util name required')

  switch (name) {
    // utility to update projects' modules list if modules were published before storage -> db data pipeline was in place
    case 'copyModuleRefsFromStorageToDB':
      try {
        console.log('[copyModuleRefsFromStorageToDB]')
        const path = `projects/${projectId}/modules/`
        const [files] = await storage
          .bucket(bucketName)
          .getFiles({ prefix: path })
        const modules = files.map(async ({ name, metadata }) => {
          const moduleName = name.replace(path, '').split('/')[0]
          const moduleDocRef = firestore.doc(`${path}${moduleName}`)
          const moduleDoc = await moduleDocRef.get()
          if (!moduleDoc.exists) {
            moduleDocRef.set({ createdAt: Date.now() })
          }
          const doc = firestore.doc(name)
          await doc.set({ name, filePath: path, ...metadata })
          return doc.path
        })
        const result = await Promise.allSettled(modules)
        return res.status(200).send(result)
      } catch (error) {
        return res.status(500).send(`Something went wrong`)
      }
      break
    default:
      return res.status(200).send()
  }
}

export const adminUtils = withAuth(adminUtilsBase)
