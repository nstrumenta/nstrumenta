import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'

function detectProjectId(): string {
  const id = process.env.GOOGLE_CLOUD_PROJECT
  if (!id) {
    console.warn(
      'GOOGLE_CLOUD_PROJECT is not set. Set it via env var or credentials/activate.sh.',
    )
    return ''
  }
  return id
}

export const projectId = detectProjectId()

export const firestore = new Firestore()
export const storage = new Storage()
export const bucketName = `${projectId}.appspot.com`
