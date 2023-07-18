import { Firestore } from '@google-cloud/firestore'
import { createHash } from 'crypto'
import { ActionData } from '../index'
import { v4 as uuid } from 'uuid'

export interface ApiKeyServiceDependencies {
  firestore: Firestore
}

export interface ApiKeyService {
  createAndAddApiKey(projectId: string): Promise<string | undefined>
  createApiKey(actionPath: string, projectId: string): Promise<void>
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
    createAndAddApiKey: async function createAndAddApiKey(projectId: string) {
      console.log('createAndAddApiKey', projectId)

      const key = uuid()
      const keyId = createKeyId(key)

      try {
        const doc = firestore.collection('keys').doc(keyId)
        const createdAt = Date.now()
        await doc.set({ projectId, createdAt })

        const projectPath = `/projects/${projectId}`

        const projectSettings = await (
          await firestore.doc(projectPath).get()
        ).data()
        const apiKeys = projectSettings?.apiKeys ? projectSettings.apiKeys : {}
        apiKeys[keyId] = { createdAt }

        await firestore.doc(projectPath).update({ apiKeys })

        return key
      } catch (err) {
        console.log(err)
      }
    },

    removeTempKey: async function removeTempKey(apiKey: string) {
      const keyId = createKeyId(apiKey)
      const doc = firestore.collection('keys').doc(keyId)
      await doc.delete()
    },

    createApiKey: async function createApiKey(
      actionPath: string,
      projectId: string,
    ) {
      console.log('createApiKey', projectId)

      const key = uuid()
      const keyId = createKeyId(key)

      try {
        const doc = firestore.collection('keys').doc(keyId)
        await doc.set({ projectId, createdAt: Date.now() })

        await firestore
          .doc(actionPath)
          .set({ status: 'complete', payload: { key, keyId } }, { merge: true })
      } catch (err) {
        console.log(err)
        await firestore
          .doc(actionPath)
          .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
      }
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

function createKeyId(key: string) {
  return createHash('sha256').update(key).update('salt').digest('hex')
}
