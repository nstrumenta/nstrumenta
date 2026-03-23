// source: https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage'
import { GoogleAuth, Impersonated } from 'google-auth-library'
import { bucketName, projectId, storage } from '../authentication/ServiceAccount'

let _signingStorage: Storage | null = null

async function getSigningStorage(): Promise<Storage> {
  if (_signingStorage) return _signingStorage
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const sourceClient = await auth.getClient()
  const impersonated = new Impersonated({
    sourceClient,
    targetPrincipal: `${projectId}@appspot.gserviceaccount.com`,
    lifetime: 3600,
    delegates: [],
    targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  _signingStorage = new Storage({ authClient: impersonated })
  return _signingStorage
}

export async function generateV4UploadSignedUrl(
  fileName: string,
  metadata?: Record<string, string>,
  origin?: string,
  overwrite?: boolean,
  contentType: string = 'application/octet-stream',
  contentDisposition?: string,
) {
  const signingStorage = await getSigningStorage()
  const file = signingStorage.bucket(bucketName).file(fileName)

  const extensionHeaders: Record<string, string> = {}
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      // Don't prefix standard headers if they are passed in metadata
      if (
        key.toLowerCase() === 'content-disposition' ||
        key.toLowerCase() === 'content-type'
      ) {
        return
      }
      extensionHeaders[`x-goog-meta-${key}`] = metadata[key]
    })
  }

  // These options will allow temporary uploading of the file with outgoing
  // Content-Type header.
  const finalContentType =
    metadata?.['contentType'] || metadata?.['content-type'] || contentType

  const options: GetSignedUrlConfig = {
    version: 'v4',
    action: 'resumable',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: finalContentType,
    extensionHeaders,
  }

  const [exists] = await file.exists()
  if (exists && !overwrite) {
    throw new Error('file exists')
  }

  // Get a v4 signed URL for uploading file
  const [url] = await file.getSignedUrl(options)
  console.log('signedUrl', url)

  const headers: Record<string, string> = {
    'content-type': finalContentType,
    'x-goog-resumable': 'start',
    ...extensionHeaders,
  }

  if (origin) {
    headers['Origin'] = origin
  }

  if (contentDisposition) {
    headers['Content-Disposition'] = contentDisposition
  } else if (metadata && metadata['contentDisposition']) {
    headers['Content-Disposition'] = metadata['contentDisposition']
  }

  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      headers[`x-goog-meta-${key}`] = metadata[key]
    })
  }

  const response = await fetch(url, { method: 'POST', headers })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GCS resumable upload initiation failed: ${response.status} ${body}`)
  }

  const location = response.headers.get('location')
  if (!location) {
    throw new Error('GCS did not return a resumable upload location')
  }

  console.log({ location })
  return location
}

// Utility to find version from storage object path
export function getVersionFromPath(path: string) {
  const match = /(\d+)\.(\d+).(\d+)/.exec(path)
  const version: string = match ? match[0] : ''
  return version
}

export async function generateV4ReadSignedUrl(fileName: string) {
  const file = storage.bucket(bucketName).file(fileName)
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  })
  return url
}
