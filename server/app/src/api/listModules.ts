import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { APIEndpoint, withAuth } from '../authentication'
import {
  bucketName,
  firestore,
  storage,
} from '../authentication/ServiceAccount'

interface ListModulesArgs {
  projectId: string
}

import { orgProjectPath } from '../shared/utils'

export async function getModulesList(projectId: string) {
  const path = `${orgProjectPath(projectId)}/modules/`
  const moduleCollection = await firestore.collection(path).get()
  const modules = moduleCollection.docs.map((doc: QueryDocumentSnapshot) => {
    const module = doc.data()
    module.id = doc.id
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
