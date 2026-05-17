import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

type ProjectRole = 'owner' | 'admin' | 'viewer'

const PROJECT_ROLES: ProjectRole[] = ['owner', 'admin', 'viewer']

// GET /api/user/projects
const listUserProjectsBase = async (
  req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const snapshots = await Promise.all(
      PROJECT_ROLES.map((role) =>
        firestore
          .collectionGroup('projects')
          .where(`members.${userId}`, '==', role)
          .get(),
      ),
    )

    const projects = new Map<string, Record<string, unknown>>()

    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        const project = doc.data()
        const orgSlug = typeof project.orgSlug === 'string' && project.orgSlug ? project.orgSlug : doc.ref.parent.parent?.id
        const slug = typeof project.slug === 'string' && project.slug ? project.slug : doc.id
        if (!orgSlug || !slug) continue

        const projectId = `${orgSlug}/${slug}`
        projects.set(projectId, {
          id: projectId,
          slug,
          orgSlug,
          ...project,
        })
      }
    }

    const sortedProjects = Array.from(projects.values()).sort((left, right) => {
      const leftOpened = typeof left.lastOpened === 'number' ? left.lastOpened : 0
      const rightOpened = typeof right.lastOpened === 'number' ? right.lastOpened : 0
      return rightOpened - leftOpened
    })

    return res.status(200).json(sortedProjects)
  } catch (error) {
    console.error('Failed to list user projects:', error)
    return res.status(500).send('Failed to list user projects')
  }
}

export const listUserProjects = withFirebaseAuth(listUserProjectsBase)