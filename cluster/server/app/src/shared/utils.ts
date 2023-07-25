// source: https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
import { GetSignedUrlConfig } from '@google-cloud/storage'
import axios from 'axios'
import { bucketName, storage } from '../authentication/ServiceAccount'

export async function generateV4UploadSignedUrl(
  fileName: string,
  metadata?: Record<string, string>,
  origin?: string,
  overwrite?: boolean,
) {
  const file = storage.bucket(bucketName).file(fileName)

  const extensionHeaders: Record<string, string> = {}
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      extensionHeaders[`x-goog-meta-${key}`] = metadata[key]
    })
  }

  // These options will allow temporary uploading of the file with outgoing
  // Content-Type: application/octet-stream header.
  const options: GetSignedUrlConfig = {
    version: 'v4',
    action: 'resumable',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'application/octet-stream',
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
    'content-type': 'application/octet-stream',
    'x-goog-resumable': 'start',
    ...(origin ? { origin } : {}),
    ...extensionHeaders,
  }

  // add metadata in headers like
  // https://stackoverflow.com/questions/58193915/how-do-i-add-metadata-to-a-file-when-uploading-via-a-gcs-signeduploadurl
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      headers[`x-goog-meta-${key}`] = metadata[key]
    })
  }

  try {
    const resumableSession = await axios({ url, method: 'POST', headers })
    location = resumableSession.headers.location
  } catch (e) {
    console.log('axios error', e)
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
