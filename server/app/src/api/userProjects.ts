import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { orgProjectPath } from '../shared/utils'

function addProjectIfMember(
  projects: Map<string, Record<string, unknown>>,
  userId: string,
  projectId: string,
  project: Record<string, unknown>,
) {
  const members = (project.members ?? {}) as Record<string, unknown>
  if (!members[userId]) return

  const [orgSlug, slug] = projectId.split('/')
  if (!orgSlug || !slug) return

  projects.set(projectId, {
    id: projectId,
    slug,
    orgSlug,
    ...project,
  })
}

// GET /api/user/projects
const listUserProjectsBase = async (
  _req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const [organizationRefsSnapshot, projectMembershipSnapshot] = await Promise.all([
      firestore.collection(`users/${userId}/organizations`).get(),
      firestore.collection(`users/${userId}/projects`).get(),
    ])

    const organizationProjectSnapshots = await Promise.all(
      organizationRefsSnapshot.docs.map((organizationDoc) =>
        firestore.collection(`organizations/${organizationDoc.id}/projects`).get(),
      ),
    )

    const indexedProjectSnapshots = await Promise.all(
      projectMembershipSnapshot.docs.map(async (projectDoc) => {
        const projectId = projectDoc.data()?.projectId
        if (typeof projectId !== 'string' || !projectId) return null

        const snapshot = await firestore.doc(orgProjectPath(projectId)).get()
        return { projectId, snapshot }
      }),
    )

    const projects = new Map<string, Record<string, unknown>>()

    for (const snapshot of organizationProjectSnapshots) {
      for (const doc of snapshot.docs) {
        const project = doc.data() as Record<string, unknown>
        const orgSlug = typeof project.orgSlug === 'string' && project.orgSlug ? project.orgSlug : doc.ref.parent.parent?.id
        const slug = typeof project.slug === 'string' && project.slug ? project.slug : doc.id
        if (!orgSlug || !slug) continue

        addProjectIfMember(projects, userId, `${orgSlug}/${slug}`, project)
      }
    }

    for (const indexedProject of indexedProjectSnapshots) {
      if (!indexedProject?.snapshot.exists) continue
      addProjectIfMember(
        projects,
        userId,
        indexedProject.projectId,
        (indexedProject.snapshot.data() ?? {}) as Record<string, unknown>,
      )
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