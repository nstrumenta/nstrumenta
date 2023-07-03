import {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from '@google-cloud/firestore'
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

export interface GetDataMetadataArgs {
  projectId: string
}

export interface GetDataMetadataBody {
  dataId: string
}

const getDataMetadataBase: APIEndpoint<GetDataMetadataArgs> = async (
  req,
  res,
  args,
) => {
  try {
    const { projectId } = args
    const { dataId }: GetDataMetadataBody = req.body
    const path = `projects/${projectId}/data`
    const results = await firestore
      .collection(path)
      .where('dataId', '==', dataId)
      .get()
    const resultsMetadata = await Promise.all(
      results.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        return doc.data()
      }),
    )

    return res.status(200).send(resultsMetadata)
  } catch (error) {
    return res.status(400).send((error as Error).message)
  }
}

export const getDataMetadata = withAuth(getDataMetadataBase)
