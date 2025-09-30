import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { firestore } from '../authentication/ServiceAccount'
import { CreateApiKeyService } from '../services/ApiKeyService'

const apiKeyService = CreateApiKeyService({ firestore })

const createApiKeyBase = async (
  req: any,
  res: any,
  args: {
    projectId: string
    apiUrl?: string
  } & FirebaseAuthResult
) => {
  const { projectId, apiUrl, authenticated, userId } = args

  try {
    if (!authenticated || !userId) {
      return res.status(401).send('Authentication required')
    }

    const projectDoc = await firestore.collection('projects').doc(projectId).get()

    if (!projectDoc.exists) {
      return res.status(404).send('Project not found')
    }

    const project = projectDoc.data()
    if (!project || !project.members || !project.members[userId]) {
      return res.status(403).send('Permission denied')
    }

    const result = await apiKeyService.createAndAddApiKey(projectId, apiUrl)

    if (!result) {
      return res.status(500).send('Failed to create API key')
    }

    const { key, keyId, createdAt } = result;

    return res.status(201).send({
      key,
      keyId,
      createdAt,
      message: 'API Key created successfully'
    })

  } catch (error) {
    console.error('Error creating api key:', error)
    return res.status(500).send('Failed to create api key')
  }
}

export const createApiKey = withFirebaseAuth(createApiKeyBase)