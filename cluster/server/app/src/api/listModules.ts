import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import {
  bucketName,
  firestore,
  storage,
} from '../authentication/ServiceAccount'
import { ListModulesArgs } from './types'

const listModulesBase: APIEndpoint<ListModulesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const path = `projects/${projectId}/modules/`
    const moduleCollection = await firestore.collection(path).get()
    const modules = moduleCollection.docs.map((doc: QueryDocumentSnapshot) =>
      doc.data(),
    )

    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModules = withAuth(listModulesBase)
