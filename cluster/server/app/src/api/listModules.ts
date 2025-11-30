import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import {
  bucketName,
  firestore,
  storage,
} from '../authentication/ServiceAccount'
import { ListModulesArgs } from './types'

export async function getModulesList(projectId: string) {
  const path = `projects/${projectId}/modules/`
  const moduleCollection = await firestore.collection(path).get()
  const modules = moduleCollection.docs.map((doc: QueryDocumentSnapshot) => {
    const module = doc.data()
    module.moduleDocumentPath = doc.ref.path
    return module
  })
  return modules
}

const listModulesBase: APIEndpoint<ListModulesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const modules = await getModulesList(projectId)
    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModules = withAuth(listModulesBase)
