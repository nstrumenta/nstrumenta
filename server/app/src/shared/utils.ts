// source: https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
import { GetSignedUrlConfig } from '@google-cloud/storage'
import { bucketName, storage } from '../authentication/ServiceAccount'

export async function generateV4UploadSignedUrl(
  fileName: string,
  metadata?: Record<string, string>,
  origin?: string,
  overwrite?: boolean,
  contentType: string = 'application/octet-stream',
  contentDisposition?: string,
) {
  const file = storage.bucket(bucketName).file(fileName)

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
  await file.generateSignedPostPolicyV4({
    expires: Date.now() + 15 * 60 * 1000,
  })
  console.log('signedUrl', url)

  let location

  const headers: Record<string, string> = {
    'content-type': finalContentType,
    'x-goog-resumable': 'start',
    ...(origin ? { origin } : {}),
    ...extensionHeaders,
  }

  if (contentDisposition) {
    headers['Content-Disposition'] = contentDisposition
  } else if (metadata && metadata['contentDisposition']) {
    headers['Content-Disposition'] = metadata['contentDisposition']
  }

  // add metadata in headers like
  // https://stackoverflow.com/questions/58193915/how-do-i-add-metadata-to-a-file-when-uploading-via-a-gcs-signeduploadurl
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      headers[`x-goog-meta-${key}`] = metadata[key]
    })
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    location = response.headers.get('location')
  } catch (e) {
    console.log('fetch error', e)
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
