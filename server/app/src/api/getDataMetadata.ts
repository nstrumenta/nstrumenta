import {
  DocumentData,
  QueryDocumentSnapshot
} from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'





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
    return res.status(400).json({ error: 'Failed to get metadata' })
  }
}

export const getDataMetadata = withAuth(getDataMetadataBase)
