import { v4 as uuid } from 'uuid'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { firestore } from '../authentication/ServiceAccount'

const createProjectBase = async (
  req: any,
  res: any,
  args: {
    name: string
    projectIdBase?: string
    orgId?: string
  } & FirebaseAuthResult
) => {
  const { name, projectIdBase: rawProjectIdBase, orgId, authenticated, userId } = args

  try {
    if (!authenticated || !userId) {
      return res.status(401).send('Authentication required')
    }

    const userDoc = await firestore.collection('users').doc(userId).get()
    const userData = userDoc.data()
    if (!userData) {
      return res.status(404).send('User not found')
    }

    let targetOrgId = orgId
    let targetOrgSlug = ''

    if (targetOrgId) {
      const orgDoc = await firestore.collection('organizations').doc(targetOrgId).get()
      if (!orgDoc.exists) return res.status(404).send('Organization not found')
      targetOrgSlug = orgDoc.data()?.slug
    } else {
      targetOrgId = userData.personalOrgId
      targetOrgSlug = userData.username
      if (!targetOrgId || !targetOrgSlug) {
        return res.status(400).send('User profile setup required before creating projects')
      }
    }

    if (!targetOrgSlug) {
      return res.status(400).send('Organization has no slug defined')
    }

    // Generate project ID base from name if not provided
    const projectSlugBase = rawProjectIdBase || encodeURIComponent(
      name
        .toLowerCase()
        .replace(/ +/g, '-')
        .replace(/[^a-z0-9_-]+/gi, '-')
    )

    // Find a unique project slug by appending random suffixes if needed
    let confirmedUnique = false
    let suffix = ''
    let projectSlug = projectSlugBase
    let existingProjectSlugDoc

    while (!confirmedUnique) {
      existingProjectSlugDoc = await firestore.collection('project-slugs').doc(`${targetOrgSlug}:${projectSlug}`).get()
      
      if (existingProjectSlugDoc.exists) {
        console.log(`Project slug ${targetOrgSlug}:${projectSlug} already exists`)
        suffix = uuid().substring(0, 5) // Use first 5 characters of UUID
        projectSlug = `${projectSlugBase}-${suffix}`
      } else {
        confirmedUnique = true
      }
    }

    const projectId = firestore.collection('projects').doc().id

    console.log('Creating new project:', { projectId, projectSlug, targetOrgSlug, name, userId })

    // Create the project document
    const newProjectDocument: any = {
      name,
      slug: projectSlug,
      orgId: targetOrgId,
      orgSlug: targetOrgSlug,
      members: {
        [userId]: 'owner'
      },
      createdAt: new Date().toISOString(),
      createdBy: userId,
      visibility: 'private'
    }

    // Use a batch to ensure all documents are created atomically
    const batch = firestore.batch()

    // Add project to main projects collection
    const projectRef = firestore.collection('projects').doc(projectId)
    batch.set(projectRef, newProjectDocument)

    // Add project-slugs lookup
    const lookupRef = firestore.collection('project-slugs').doc(`${targetOrgSlug}:${projectSlug}`)
    batch.set(lookupRef, { projectId })

    // Add project reference to user's projects subcollection
    const userProjectRef = firestore.collection(`users/${userId}/projects`).doc(projectId)
    batch.set(userProjectRef, { name, orgSlug: targetOrgSlug, slug: projectSlug })

    await batch.commit()

    return res.status(201).send({
      id: projectId,
      slug: projectSlug,
      orgSlug: targetOrgSlug,
      name,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Error creating project:', error)
    return res.status(500).send('Failed to create project')
  }
}

export const createProject = withFirebaseAuth(createProjectBase)
