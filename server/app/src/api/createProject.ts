import { v4 as uuid } from 'uuid'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { firestore } from '../authentication/ServiceAccount'

const createProjectBase = async (
  req: any,
  res: any,
  args: {
    name: string
    projectIdBase?: string
  } & FirebaseAuthResult
) => {
  const { name, projectIdBase: rawProjectIdBase, authenticated, userId } = args

  try {
    if (!authenticated || !userId) {
      return res.status(401).send('Authentication required')
    }

    // Generate project ID base from name if not provided
    const projectIdBase = rawProjectIdBase || encodeURIComponent(
      name
        .toLowerCase()
        .replace(/ +/g, '-')
        .replace(/[^a-z0-9 _-]+/gi, '-')
    )

    // Find a unique project ID by appending random suffixes if needed
    let confirmedUnique = false
    let suffix = ''
    let projectId = projectIdBase

    while (!confirmedUnique) {
      const existingProject = await firestore.collection('projects').doc(projectId).get()
      
      if (existingProject.exists) {
        console.log(`Project ID ${projectId} already exists`)
        suffix = uuid().substring(0, 5) // Use first 5 characters of UUID
        projectId = `${projectIdBase}-${suffix}`
      } else {
        confirmedUnique = true
      }
    }

    console.log('Creating new project:', { projectId, name, userId })

    // Create the project document
    const newProjectDocument = {
      name,
      members: {
        [userId]: 'owner'
      },
      createdAt: new Date().toISOString(),
      createdBy: userId
    }

    // Use a batch to ensure both documents are created atomically
    const batch = firestore.batch()

    // Add project to main projects collection
    const projectRef = firestore.collection('projects').doc(projectId)
    batch.set(projectRef, newProjectDocument)

    // Add project reference to user's projects subcollection
    const userProjectRef = firestore.collection(`users/${userId}/projects`).doc(projectId)
    batch.set(userProjectRef, { name })

    await batch.commit()

    return res.status(201).send({
      id: projectId,
      name,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Error creating project:', error)
    return res.status(500).send('Failed to create project')
  }
}

export const createProject = withFirebaseAuth(createProjectBase)
