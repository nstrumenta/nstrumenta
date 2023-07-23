import { Query } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export interface QueryDataArgs {
  projectId: string
}
export interface QueryDataOptions {
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
  limit?: number
}

const queryDataBase: APIEndpoint<QueryDataArgs> = async (req, res, args) => {
  const { projectId } = args

  const {
    field,
    comparison,
    compareValue,
    limit = 100,
  }: QueryDataOptions = req.body

  console.log(
    'query:',
    JSON.stringify({
      field,
      comparison,
      compareValue,
      limit,
    }),
  )
  try {
    const path = `projects/${projectId}/data`
    const collectionRef = firestore.collection(path)

    const query: Query = collectionRef.where(field, comparison, compareValue)
    const snapshot = await query.get()
    let docs = snapshot.docs.map((doc) => doc.data())

    return res.status(200).send(docs)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const queryData = withAuth(queryDataBase)
