import { APIEndpoint, withAuth } from '../authentication'
import { bucketName, storage } from '../authentication/ServiceAccount'
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
    console.log({ prefix: path })

    const [dir] = await storage.bucket(bucketName).getFiles({ prefix: path })
    const modules = dir.map(({ name }) => name.replace(path, ''))

    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModules = withAuth(listModulesBase)
