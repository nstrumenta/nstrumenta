import { APIEndpoint, withAuth } from '../authentication'
import {
  bucketName,
  firestore,
  storage,
} from '../authentication/ServiceAccount'

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
