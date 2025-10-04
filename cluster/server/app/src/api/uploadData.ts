import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { generateV4UploadSignedUrl } from '../shared/utils'

interface UploadDataRequest {
  projectId: string
  name: string
  size: number
  contentType?: string
  folder?: string
}

const uploadDataBase = async (
  req: any,
  res: any,
  args: UploadDataRequest & FirebaseAuthResult
) => {
  const { projectId, authenticated, userId } = args

  if (!authenticated || !userId) {
    return res.status(401).send('Authentication required')
  }

  const { name, size, contentType, folder } = req.body

  if (!name || !size) {
    return res.status(400).send('Missing required fields: name, size')
  }

  try {
    const timestamp = Date.now()
    const normalizedFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : ''
    const folderPath = normalizedFolder ? `${normalizedFolder}/` : ''
    const filePath = `projects/${projectId}/data/${folderPath}${name}`

    const uploadUrl = await generateV4UploadSignedUrl(filePath, {
      name,
      folder: normalizedFolder,
      size: `${size}`,
      contentType: contentType || 'application/octet-stream',
      uploadedBy: userId,
      uploadedAt: `${timestamp}`,
    })

    return res.status(200).send({ uploadUrl, filePath })
  } catch (error) {
    console.error('Upload data error:', error)
    return res.status(500).send(`Upload failed: ${(error as Error).message}`)
  }
}

export const uploadData = withFirebaseAuth(uploadDataBase)
