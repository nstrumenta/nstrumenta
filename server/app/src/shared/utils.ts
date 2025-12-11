// source: https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
import { GetSignedUrlConfig } from '@google-cloud/storage'
import { spawn } from 'child_process'
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

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: { cwd?: string; quiet?: boolean },
  errCB?: (code: number) => void,
) {
  if (!options?.quiet) console.log(`${cmd} ${args?.join(' ')}`)
  const process = spawn(cmd, args || [], options)

  let output = ''
  for await (const chunk of process.stdout) {
    output += chunk
  }
  let error = ''
  for await (const chunk of process.stderr) {
    error += chunk
  }
  const code: number = await new Promise((resolve) => {
    process.on('close', resolve)
  })
  if (code) {
    if (errCB) {
      errCB(code)
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`)
  }
  if (!options?.quiet) {
    console.log(`${cmd} ${args?.join(' ')}`, output, error)
  }
  return output
}
