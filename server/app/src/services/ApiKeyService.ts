import { Firestore } from '@google-cloud/firestore'
import { randomBytes, scryptSync } from 'crypto'
import { v4 as uuid } from 'uuid'
import { ActionData } from '../index'

import { serviceAccount } from '../authentication/ServiceAccount'

export interface ApiKeyServiceDependencies {
  firestore: Firestore
}

export interface ApiKeyService {
  createAndAddApiKey(
    projectId: string,
    apiUrl?: string,
  ): Promise<{ key: string; keyId: string; createdAt: number } | undefined>
  removeTempKey(apiKey: string): Promise<void>
  revokeApiKey(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
}

export function CreateApiKeyService({
  firestore,
}: ApiKeyServiceDependencies): ApiKeyService {
  return {
    createAndAddApiKey: async function createAndAddApiKey(
      projectId: string,
      apiUrlParam?: string,
    ) {
      // apiUrl: payload > projectData > nstrumentaDeployment

      const projectData = (
        await firestore.doc(`/projects/${projectId}`).get()
      ).data()
      const apiUrl =
        apiUrlParam ??
        projectData?.apiUrl ??
        (
          (await (
            await fetch(
              `https://storage.googleapis.com/${serviceAccount.project_id}-config/nstrumentaDeployment.json`,
            )
          ).json()) as { apiUrl: string }
        ).apiUrl

      console.log('createAndAddApiKey', projectId, apiUrl)

      // New Key Format: accessKeyId (16 hex) + secretAccessKey (32 hex)
      const accessKeyId = randomBytes(8).toString('hex')
      const secretAccessKey = randomBytes(16).toString('hex')
      const key = `${accessKeyId}${secretAccessKey}`
      
      // Salt for scrypt
      const salt = randomBytes(16).toString('hex')
      const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || ''
      
      // Hash the secret part
      const hash = scryptSync(secretAccessKey, salt + pepper, 64).toString('hex')

      try {
        // Store under accessKeyId (public ID)
        const doc = firestore.collection('keys').doc(accessKeyId)
        const createdAt = Date.now()
        
        await doc.set({ 
          projectId, 
          createdAt,
          salt,
          hash,
          version: 'v2' // Mark as new version
        })

        const projectPath = `/projects/${projectId}`

        const projectDoc = await (await firestore.doc(projectPath).get()).data()
        const apiKeys = projectDoc?.apiKeys ? projectDoc.apiKeys : {}
        
        // Store metadata in project
        apiKeys[accessKeyId] = { createdAt }

        await firestore.doc(projectPath).update({ apiKeys })

        const keyWithUrl = `${key}:${btoa(apiUrl)}`
        return { key: keyWithUrl, keyId: accessKeyId, createdAt }
      } catch (err) {
        console.log(err)
      }
    },

    removeTempKey: async function removeTempKey(apiKey: string) {
      const keyPart = apiKey.split(':')[0]
      // Only supports V2 keys
      if (keyPart.length !== 48) {
        console.warn('Attempted to remove invalid key format')
        return
      }
      const keyId = keyPart.substring(0, 16)
      const doc = firestore.collection('keys').doc(keyId)
      await doc.delete()
    },

    revokeApiKey: async function revokeApiKey(
      actionPath: string,
      projectId: string,
      data: ActionData,
    ) {
      console.log('revokeApiKey', projectId, data)
      const keyId = data.payload.keyId
      try {
        const doc = firestore.collection('keys').doc(keyId)
        await doc.delete()

        await firestore
          .doc(actionPath)
          .set({ status: 'complete', payload: { keyId } }, { merge: true })
      } catch (err) {
        console.log(err)
        await firestore
          .doc(actionPath)
          .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
      }
    },
  }
}
