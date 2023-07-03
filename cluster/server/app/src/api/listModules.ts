import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'
import { ListModulesArgs } from './types'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})
const bucketName = `${serviceAccount.project_id}.appspot.com`
const bucket = storage.bucket(bucketName)

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

    // TODO: Maybe these should be in firestore for up-to-date lists
    const [dir] = await storage.bucket(bucketName).getFiles({ prefix: path })
    const modules = dir.map(({ name }) => name.replace(path, ''))

    return res.status(200).send(modules)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const listModules = withAuth(listModulesBase)
