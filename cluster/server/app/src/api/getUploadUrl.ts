import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'
import { generateV4UploadSignedUrl } from '../shared/utils'

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

export interface UploadModuleFilesArgs {
  projectId: string
  version: string
}

export interface UploadModuleFilesBody {
  path: string
  size: number
  metadata?: Record<string, string>
}
// TODO: make second upload function for data; generate id on server
// path e.g.: 'projects/projectId/data/[file with key: uuid]+{metadata with name, downloadURL}

const getUploadUrlBase: APIEndpoint<UploadModuleFilesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const { path: originalPath, metadata }: UploadModuleFilesBody = req.body
    // Clear any potential leading slashes
    const path = originalPath.replace(/^(\/)*/, '/')
    const storagePathBase = `projects/${projectId}`

    const uploadUrl = await generateV4UploadSignedUrl(
      `${storagePathBase}${path}`,
      metadata,
    )
    console.log({ uploadUrl })
    return res.status(200).send({ uploadUrl })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      error.message === 'file exists'
    ) {
      return res.status(409).send(error.message)
    }
    res.status(500).send(`Something went wrong`)
  }
}

export const getUploadUrl = withAuth(getUploadUrlBase)
