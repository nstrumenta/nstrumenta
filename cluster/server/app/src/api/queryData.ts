import {
  CollectionReference,
  DocumentData,
  Query,
} from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface QueryDataArgs {
  projectId: string
}
export interface QueryDataOptions {
  id?: string
  before?: number
  after?: number
  tags?: string[]
  filenames?: string[]
  field: string
  comparison:
    | '<'
    | '<='
    | '=='
    | '>'
    | '>='
    | '!='
    | 'array-contains'
    | 'array-contains-any'
    | 'in'
    | 'not-in'
  compareValue: string
  metadata?: Record<string, string | number>
}

const queryDataBase: APIEndpoint<QueryDataArgs> = async (req, res, args) => {
  const { projectId } = args
  console.log({ projectId })

  const {
    id,
    tags,
    before,
    after,
    filenames,
    metadata,
    field,
    comparison,
    compareValue,
  }: QueryDataOptions = req.body

  const metadataQueries = metadata ? Object.entries(metadata) : []

  console.log('query:', {
    id,
    tags,
    filenames,
    before,
    after,
    metadata,
    field,
    comparison,
    compareValue,
  })
  try {
    const path = `projects/${projectId}/data`
    const collectionRef = firestore.collection(path)

    const query: Query | CollectionReference =
      metadataQueries.length > 0
        ? metadataQueries.reduce<Query>((acc, [key, value]) => {
            return acc.where(key, '==', value)
          }, collectionRef)
        : field
        ? collectionRef.where(field, comparison, compareValue)
        : collectionRef

    const snapshot = await query.get()
    let docs = snapshot.docs.map((doc) => doc.data())

    if (tags) {
      docs = docs.filter((doc: DocumentData & { tags?: string[] }) => {
        // filter on optional set of tags
        return doc.tags && doc.tags.findIndex((tag) => tags?.includes(tag)) > -1
      })
    }

    console.log(docs)
    return res.status(200).send(docs)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const queryData = withAuth(queryDataBase)
