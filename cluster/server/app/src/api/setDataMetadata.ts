import { Firestore, QueryDocumentSnapshot } from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'

const TIMEOUT = 30000

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

export interface SetDataMetadataArgs {
  projectId: string
}

export interface SetDataMetadataBody {
  metadata: Record<string, unknown>
  merge: boolean
  dataId: string
  timeout?: number
}

const setDataMetadataBase: APIEndpoint<SetDataMetadataArgs> = async (
  req,
  res,
  args,
) => {
  try {
    const { projectId } = args
    const {
      dataId,
      merge = true,
      metadata,
      timeout = TIMEOUT,
    }: SetDataMetadataBody = req.body
    const path = `projects/${projectId}/data`
    const collectionRef = firestore.collection(path)
    let ref = await collectionRef.where('dataId', '==', dataId).get()
    if (ref.docs.length === 0) {
      // poll for existence, in case file has been uploaded to storage but setStorageObject has not yet completed
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          console.log(`polling for existence of ${dataId} for ${timeout}ms`)
          ref = await collectionRef.where('dataId', '==', dataId).get()
          if (ref.docs.length > 0) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(interval)
          reject(
            new Error(`timeout: no documents found with dataId [${dataId}]`),
          )
        }, timeout)
      })
    }
    await Promise.all(
      ref.docs.map(async (doc) => {
        return doc.ref.set({ ...metadata, dataId }, { merge })
      }),
    )

    const updatedMetadata = await Promise.all(
      ref.docs.map(async (doc) => {
        const updatedDoc = await doc.ref.get()
        const data = updatedDoc.data()
        return data
      }),
    )

    return res.status(200).send(updatedMetadata)
  } catch (error) {
    return res.status(400).send((error as Error).message)
  }
}

export const setDataMetadata = withAuth(setDataMetadataBase)
