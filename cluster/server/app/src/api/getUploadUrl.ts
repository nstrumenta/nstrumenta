import { APIEndpoint, withAuth } from '../authentication'
import { generateV4UploadSignedUrl } from '../shared/utils'

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
