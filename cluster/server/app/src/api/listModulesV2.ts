import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'
import { ListModulesArgs } from './types'

const listModulesV2Base: APIEndpoint<ListModulesArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  try {
    const path = `projects/${projectId}/modules/`

    const collection = firestore.collection(path)
    const docRefs = await collection.listDocuments()
    const modulePromises = docRefs.map(async (docRef) => {
      const doc = await docRef.get()
      return { id: doc.id, metadata: doc.data() }
    })
    const modules = await Promise.all(modulePromises)

    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModulesV2 = withAuth(listModulesV2Base)
