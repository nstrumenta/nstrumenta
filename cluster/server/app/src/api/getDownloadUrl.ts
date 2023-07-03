import { GetSignedUrlConfig, Storage } from '@google-cloud/storage'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'

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

export interface DownloadModuleFilesArgs {
  projectId: string
  version: string
}

export interface DownloadModuleFilesBody {
  path: string
}

const getDownloadUrlBase =
  (pathInProject: string): APIEndpoint<DownloadModuleFilesArgs> =>
  async (req, res, args) => {
    console.log('args', args)
    const { projectId } = args
    try {
      console.log(req.body)
      const { path }: DownloadModuleFilesBody = req.body
      if (!path) {
        throw new Error('path required')
      }

      //allow for full filePath or path within project
      const projectPrefix = `projects/${projectId}/`
      const pathAfterBase = path.startsWith(projectPrefix)
        ? path.slice(projectPrefix.length)
        : path

      const storagePathBase = `projects/${projectId}/${pathInProject}`

      const url = await generateV4DownloadSignedUrl(
        `${storagePathBase}${pathAfterBase.replace(/^\//, '')}`,
      )
      console.log({ url })
      return res.status(200).send(url)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message &&
        error.message === `file doesn't exist`
      ) {
        return res.status(404).send(error.message)
      }
      res.status(500).send(`Something went wrong`)
    }
  }
export const getDownloadUrl = withAuth(getDownloadUrlBase('modules/'))
export const getProjectDownloadUrl = withAuth(getDownloadUrlBase(''))

async function generateV4DownloadSignedUrl(fileName: string) {
  const file = storage.bucket(bucketName).file(fileName)

  const options: GetSignedUrlConfig = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 72 * 60 * 60 * 1000, // 72 hrs
  }

  const [exists] = await file.exists()
  if (!exists) {
    throw new Error(`file doesn't exist`)
  }

  // Get a v4 signed URL for downloading file
  const [url] = await file.getSignedUrl(options)
  console.log('signedUrl', url)

  return url
}
