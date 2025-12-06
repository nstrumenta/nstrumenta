import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'

const serviceKeyJson = process.env.GCLOUD_SERVICE_KEY
if (serviceKeyJson == undefined) throw new Error('GCLOUD_SERVICE_KEY undefined')
export const serviceAccount = JSON.parse(serviceKeyJson)

export const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

export const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})
export const bucketName = `${serviceAccount.project_id}.appspot.com`
