import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} env var is required`)
  return value
}

export const projectId = requireEnv('GOOGLE_CLOUD_PROJECT')
export const cloudRegion = requireEnv('CLOUD_REGION')
export const previewImageRegistry = requireEnv('PREVIEW_IMAGE_REGISTRY')

export const firestore = new Firestore()
export const storage = new Storage()
export const bucketName = `${projectId}.appspot.com`
