import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

type ProjectDoc = {
  visibility?: string
  members?: Record<string, string>
  keyFile?: unknown
  [key: string]: unknown
}

function sanitizeProjectForMember(projectId: string, project: ProjectDoc) {
  const { keyFile, ...safeProject } = project
  return { id: projectId, ...safeProject }
}

function sanitizeProjectForPublic(projectId: string, project: ProjectDoc) {
  return {
    id: projectId,
    name: project.name,
    slug: project.slug,
    orgSlug: project.orgSlug,
    visibility: project.visibility,
  }
}

const getProjectSettingsBase = async (
  _req: Request,
  res: Response,
  args: { orgId: string; projectId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const fullProjectId = `${orgId}/${projectId}`
    const projectSnapshot = await firestore.doc(`organizations/${orgId}/projects/${projectId}`).get()
    if (!projectSnapshot.exists) return res.status(404).send('Project not found')

    const project = (projectSnapshot.data() ?? {}) as ProjectDoc
    const isMember = !!project.members?.[userId]
    const isPublic = project.visibility === 'public'

    if (!isMember && !isPublic) {
      return res.status(403).send('Not authorized to view this project')
    }

    return res.status(200).json(
      isMember
        ? sanitizeProjectForMember(fullProjectId, project)
        : sanitizeProjectForPublic(fullProjectId, project),
    )
  } catch (error) {
    console.error('Failed to get project settings:', error)
    return res.status(500).send('Failed to get project settings')
  }
}

export const getProjectSettings = withFirebaseAuth(getProjectSettingsBase)