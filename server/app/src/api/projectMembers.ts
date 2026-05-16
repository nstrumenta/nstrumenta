import { Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

// GET /api/orgs/:orgId/projects/:projectId/members
const listProjectMembersBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; projectId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  const projectPath = `organizations/${orgId}/projects/${projectId}`

  try {
    const projectDoc = await firestore.doc(projectPath).get()
    if (!projectDoc.exists) return res.status(404).send('Project not found')

    const members = (projectDoc.data()?.members || {}) as Record<string, ProjectMemberRole>
    const callerRole = members[userId]
    if (!callerRole) return res.status(403).send('Not a project member')

    const memberIds = Object.keys(members)
    const userRecords = await getAuth().getUsers(memberIds.map(uid => ({ uid })))

    const result = memberIds.map(uid => {
      const user = userRecords.users.find(u => u.uid === uid)
      return {
        memberId: uid,
        email: user?.email ?? '',
        displayName: user?.displayName ?? '',
        role: members[uid],
      }
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Failed to list project members:', error)
    return res.status(500).send('Failed to list project members')
  }
}

export const listProjectMembers = withFirebaseAuth(listProjectMembersBase)

type ProjectMemberRole = 'owner' | 'admin' | 'viewer'

function isProjectMemberRole(value: string): value is ProjectMemberRole {
  return value === 'owner' || value === 'admin' || value === 'viewer'
}

function countOwners(members: Record<string, ProjectMemberRole>): number {
  return Object.values(members).filter((role) => role === 'owner').length
}

// PATCH /api/orgs/:orgId/projects/:projectId/members/:memberId
const updateProjectMemberRoleBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; projectId: string; memberId: string; role: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId, memberId, role } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')
  if (!isProjectMemberRole(role)) {
    return res.status(400).send('role must be one of: owner, admin, viewer')
  }

  const projectPath = `organizations/${orgId}/projects/${projectId}`

  try {
    const projectDoc = await firestore.doc(projectPath).get()
    if (!projectDoc.exists) return res.status(404).send('Project not found')

    const members = (projectDoc.data()?.members || {}) as Record<string, ProjectMemberRole>
    const callerRole = members[userId]
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only project owners and admins can manage members')
    }

    const targetRole = members[memberId]
    if (!targetRole) return res.status(404).send('Project member not found')

    if (callerRole === 'admin' && (targetRole === 'owner' || role === 'owner')) {
      return res.status(403).send('Project admins cannot modify owner roles')
    }

    if (targetRole === 'owner' && role !== 'owner' && countOwners(members) <= 1) {
      return res.status(400).send('Cannot remove the last project owner')
    }

    const updatedMembers = {
      ...members,
      [memberId]: role,
    }

    await firestore.doc(projectPath).update({ members: updatedMembers })

    return res.status(200).json({ memberId, role })
  } catch (error) {
    console.error('Failed to update project member role:', error)
    return res.status(500).send('Failed to update project member role')
  }
}

export const updateProjectMemberRole = withFirebaseAuth(updateProjectMemberRoleBase)

// DELETE /api/orgs/:orgId/projects/:projectId/members/:memberId
const removeProjectMemberBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; projectId: string; memberId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId, memberId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  const projectPath = `organizations/${orgId}/projects/${projectId}`

  try {
    const projectDoc = await firestore.doc(projectPath).get()
    if (!projectDoc.exists) return res.status(404).send('Project not found')

    const members = (projectDoc.data()?.members || {}) as Record<string, ProjectMemberRole>
    const callerRole = members[userId]
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only project owners and admins can manage members')
    }

    const targetRole = members[memberId]
    if (!targetRole) return res.status(404).send('Project member not found')

    if (callerRole === 'admin' && targetRole === 'owner') {
      return res.status(403).send('Project admins cannot remove project owners')
    }

    if (targetRole === 'owner' && countOwners(members) <= 1) {
      return res.status(400).send('Cannot remove the last project owner')
    }

    const updatedMembers = { ...members }
    delete updatedMembers[memberId]

    await firestore.doc(projectPath).update({ members: updatedMembers })

    return res.status(200).json({ removed: memberId })
  } catch (error) {
    console.error('Failed to remove project member:', error)
    return res.status(500).send('Failed to remove project member')
  }
}

export const removeProjectMember = withFirebaseAuth(removeProjectMemberBase)