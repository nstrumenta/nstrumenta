import { Query } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface QueryCollectionArgs {
  projectId: string
}
export interface QueryCollectionOptions {
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
  collection?: 'data' | 'modules'
  limit?: number
}

const queryCollectionBase: APIEndpoint<QueryCollectionArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args

  const {
    field,
    comparison,
    compareValue,
    collection = 'data',
    limit = 100,
  }: QueryCollectionOptions = req.body

  console.log(
    'query:',
    JSON.stringify({
      field,
      comparison,
      compareValue,
      collection,
      limit,
    }),
  )
  try {
    const path = `projects/${projectId}/${collection}`
    const collectionRef = firestore.collection(path)

    const query: Query = collectionRef.where(field, comparison, compareValue)
    const snapshot = await query.get()
    let docs = snapshot.docs.map((doc) => doc.data())

    return res.status(200).send(docs)
  } catch (error) {
    res.status(500).send((error as Error)?.message ?? 'Something went wrong')
  }
}

export const queryCollection = withAuth(queryCollectionBase)
