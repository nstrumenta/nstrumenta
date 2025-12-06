import { APIEndpoint, withAuth } from '../authentication'
import { generateV4UploadSignedUrl } from '../shared/utils'
import { firestore } from '../authentication/ServiceAccount'
import crypto from 'crypto'

export interface GetUploadDataArgs {
  projectId: string
  version: string
}

export interface GetUploadDataBody {
  size: number
  name: string
  dataId?: string
  metadata?: Record<string, unknown>
  overwrite?: boolean
}

// path e.g.: 'projects/projectId/data/[file with key: uuid]+{metadata with name, downloadURL}

const getUploadDataUrlBase: APIEndpoint<GetUploadDataArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const {
      name,
      size,
      dataId: dataIdUserSpecified,
      metadata,
      overwrite,
    }: GetUploadDataBody = req.body
    const { origin } = req.headers

    const storagePathBase = `projects/${projectId}/data`

    console.log(`generate data upload url for name: ${name}`)
    const filePath = `${storagePathBase}/${name}`
    const uploadUrl = await generateV4UploadSignedUrl(
      filePath,
      {
        name,
        size: `${size}`,
        lastModified: `${Date.now()}`,
        ...metadata,
      },
      origin,
      overwrite,
    )

    // Simulate Cloud Function: Write metadata to Firestore
    // This is needed for local testing where Cloud Functions are not running
    if (process.env.NODE_ENV !== 'production') {
      const hash = crypto.createHash('sha256').update(filePath).digest('hex')
      const docRef = firestore.collection(storagePathBase).doc(hash)
      await docRef.set({
        name: name,
        filePath: filePath,
        size: size,
        lastModified: Date.now(),
        ...metadata,
      })
    }

    return res
      .status(200)
      .send({ uploadUrl, remoteFilePath: filePath, ...metadata })
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

export const getUploadDataUrl = withAuth(getUploadDataUrlBase)
