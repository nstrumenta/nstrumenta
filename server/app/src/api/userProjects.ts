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

function getOrganizationProjectCollectionPath(organizationDoc: { id: string; data(): Record<string, unknown> }) {
  const organization = organizationDoc.data()
  const orgSlug = typeof organization.slug === 'string' && organization.slug ? organization.slug : organizationDoc.id
  return `organizations/${orgSlug}/projects`
}

// POST /api/user/projects/repair
// Backfills users/{uid}/projects index from project_membership_added notifications.
// Safe to call multiple times — uses set() which is idempotent.
export const repairUserProjectMembershipsBase = async (
  _req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).json({ message: 'Authentication required' })

  try {
    const notificationsSnap = await firestore
      .collection(`users/${userId}/notifications`)
      .where('type', '==', 'project_membership_added')
      .get()

    const writes: Promise<unknown>[] = []
    for (const doc of notificationsSnap.docs) {
      const data = doc.data()
      const projectId = typeof data.projectId === 'string' ? data.projectId : null
      if (!projectId || projectId.split('/').length !== 2) continue

      const { orgSlug, projectSlug } = (function () {
        const [o, p] = projectId.split('/')
        return { orgSlug: o, projectSlug: p }
      })()

      const membershipPath = `users/${userId}/projects/${orgSlug}__${projectSlug}`
      writes.push(
        firestore.doc(membershipPath).set(
          { projectId, addedAt: data.createdAt ?? Date.now() },
          { merge: true },
        ),
      )
    }

    await Promise.all(writes)
    return res.status(200).json({ repaired: writes.length })
  } catch (error) {
    console.error('Failed to repair user project memberships:', error)
    return res.status(500).json({ message: 'Failed to repair user project memberships' })
  }
}

export const repairUserProjectMemberships = withFirebaseAuth(repairUserProjectMembershipsBase)

// GET /api/user/projects
const listUserProjectsBase = async (
  _req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).json({ message: 'Authentication required' })

  try {
    const [organizationRefsSnapshot, projectMembershipSnapshot] = await Promise.all([
      firestore.collection(`users/${userId}/organizations`).get(),
      firestore.collection(`users/${userId}/projects`).get(),
    ])

    const organizationProjectSnapshots = await Promise.all(
      organizationRefsSnapshot.docs.map((organizationDoc) =>
        firestore.collection(getOrganizationProjectCollectionPath(organizationDoc)).get(),
      ),
    )

    const indexedProjectSnapshots = await Promise.all(
      projectMembershipSnapshot.docs.map(async (projectDoc) => {
        const projectId = projectDoc.data()?.projectId
        if (typeof projectId !== 'string' || !projectId) return null

        try {
          const snapshot = await firestore.doc(orgProjectPath(projectId)).get()
          return { projectId, snapshot }
        } catch (error) {
          console.warn('Skipping malformed user project membership', { userId, projectId, error })
          return null
        }
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
    return res.status(500).json({ message: 'Failed to list user projects' })
  }
}

export const listUserProjects = withFirebaseAuth(listUserProjectsBase)