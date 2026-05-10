import { Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// POST /api/orgs/:orgId/invitations
const inviteMemberBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; email: string; role: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, email, role } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')
  if (!email) return res.status(400).send('email is required')

  const validRoles = ['admin', 'member']
  if (!validRoles.includes(role)) {
    return res.status(400).send(`role must be one of: ${validRoles.join(', ')}`)
  }

  try {
    // Verify caller is owner or admin
    const callerMember = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!callerMember.exists) return res.status(403).send('Not a member')
    const callerRole = callerMember.data()?.role
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only owners and admins can invite members')
    }

    // Check if user is already a member
    let existingUser = false
    let targetUserId: string | null = null
    try {
      const userRecord = await getAuth().getUserByEmail(email)
      targetUserId = userRecord.uid
      existingUser = true

      const existingMember = await firestore
        .doc(`organizations/${orgId}/members/${targetUserId}`)
        .get()
      if (existingMember.exists) {
        return res.status(409).send('User is already a member of this organization')
      }
    } catch {
      // User doesn't exist yet - that's fine, invitation will be pending
    }

    // Check for existing pending invitation
    const existingInvitations = await firestore
      .collection(`organizations/${orgId}/invitations`)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get()
    if (!existingInvitations.empty) {
      return res.status(409).send('A pending invitation already exists for this email')
    }

    const timestamp = Date.now()
    const invitationRef = firestore.collection(`organizations/${orgId}/invitations`).doc()

    await invitationRef.set({
      email,
      role,
      invitedBy: userId,
      status: 'pending',
      createdAt: timestamp,
      expiresAt: timestamp + INVITATION_EXPIRY_MS,
    })

    // If user already exists, add them directly (auto-accept)
    if (existingUser && targetUserId) {
      await acceptInvitationInternal(orgId, invitationRef.id, targetUserId, email)
      return res.status(201).json({
        invitationId: invitationRef.id,
        email,
        status: 'accepted',
        existingUser: true,
      })
    }

    console.log(`Invitation created for ${email} to org ${orgId} - email sending not yet implemented`)

    return res.status(201).json({
      invitationId: invitationRef.id,
      email,
      status: 'pending',
      existingUser: false,
    })
  } catch (error) {
    console.error('Failed to create invitation:', error)
    return res.status(500).send('Failed to create invitation')
  }
}

export const inviteMember = withFirebaseAuth(inviteMemberBase)

// POST /api/orgs/:orgId/projects/:projectId/invitations
const inviteProjectMemberBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; projectId: string; email: string; role: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId, email, role } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')
  if (!email) return res.status(400).send('email is required')

  const validRoles = ['admin', 'viewer']
  if (!validRoles.includes(role)) {
    return res.status(400).send(`role must be one of: ${validRoles.join(', ')}`)
  }

  const projectPath = `organizations/${orgId}/projects/${projectId}`

  try {
    const projectDoc = await firestore.doc(projectPath).get()
    if (!projectDoc.exists) return res.status(404).send('Project not found')

    const members = projectDoc.data()?.members || {}
    if (members[userId] !== 'admin') {
      return res.status(403).send('Only project admins can invite members')
    }

    let existingUser = false
    let targetUserId: string | null = null
    try {
      const userRecord = await getAuth().getUserByEmail(email)
      targetUserId = userRecord.uid
      existingUser = true

      if (members[targetUserId]) {
        return res.status(409).send('User is already a member of this project')
      }
    } catch {
      // User does not exist yet, leave invitation pending.
    }

    const invitationPath = `${projectPath}/invitations`
    const existingInvitations = await firestore
      .collection(invitationPath)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    if (!existingInvitations.empty) {
      return res.status(409).send('A pending invitation already exists for this email')
    }

    const timestamp = Date.now()
    const invitationRef = firestore.collection(invitationPath).doc()
    await invitationRef.set({
      email,
      role,
      invitedBy: userId,
      status: 'pending',
      createdAt: timestamp,
      expiresAt: timestamp + INVITATION_EXPIRY_MS,
    })

    if (existingUser && targetUserId) {
      await firestore.doc(projectPath).update({
        members: {
          ...members,
          [targetUserId]: role,
        },
      })

      await invitationRef.update({
        status: 'accepted',
        acceptedAt: timestamp,
        acceptedBy: targetUserId,
      })

      return res.status(201).json({
        invitationId: invitationRef.id,
        email,
        status: 'accepted',
        existingUser: true,
      })
    }

    console.log(`Project invitation created for ${email} in ${orgId}/${projectId} - email sending not yet implemented`)

    return res.status(201).json({
      invitationId: invitationRef.id,
      email,
      status: 'pending',
      existingUser: false,
    })
  } catch (error) {
    console.error('Failed to create project invitation:', error)
    return res.status(500).send('Failed to create project invitation')
  }
}

export const inviteProjectMember = withFirebaseAuth(inviteProjectMemberBase)

// POST /api/orgs/:orgId/projects/:projectId/invitations/:invitationId/accept
const acceptProjectInvitationBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; projectId: string; invitationId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, projectId, invitationId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  const projectPath = `organizations/${orgId}/projects/${projectId}`
  const invitationPath = `${projectPath}/invitations/${invitationId}`

  try {
    const invitationRef = firestore.doc(invitationPath)
    const invitationDoc = await invitationRef.get()
    if (!invitationDoc.exists) return res.status(404).send('Invitation not found')

    const invitation = invitationDoc.data()!
    if (invitation.status !== 'pending') {
      return res.status(400).send(`Invitation is ${invitation.status}`)
    }
    if (invitation.expiresAt < Date.now()) {
      await invitationRef.update({ status: 'expired' })
      return res.status(400).send('Invitation has expired')
    }

    const userRecord = await getAuth().getUser(userId)
    if (userRecord.email !== invitation.email) {
      return res.status(403).send('This invitation is for a different email address')
    }

    const projectDoc = await firestore.doc(projectPath).get()
    if (!projectDoc.exists) return res.status(404).send('Project not found')

    const members = projectDoc.data()?.members || {}
    await firestore.doc(projectPath).update({
      members: {
        ...members,
        [userId]: invitation.role,
      },
    })

    await invitationRef.update({
      status: 'accepted',
      acceptedAt: Date.now(),
      acceptedBy: userId,
    })

    return res.status(200).json({ accepted: true, orgId, projectId })
  } catch (error) {
    console.error('Failed to accept project invitation:', error)
    return res.status(500).send('Failed to accept project invitation')
  }
}

export const acceptProjectInvitation = withFirebaseAuth(acceptProjectInvitationBase)

// POST /api/orgs/:orgId/invitations/:invitationId/accept
const acceptInvitationBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; invitationId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, invitationId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const invitationRef = firestore.doc(
      `organizations/${orgId}/invitations/${invitationId}`,
    )
    const invitationDoc = await invitationRef.get()
    if (!invitationDoc.exists) return res.status(404).send('Invitation not found')

    const invitation = invitationDoc.data()!
    if (invitation.status !== 'pending') {
      return res.status(400).send(`Invitation is ${invitation.status}`)
    }
    if (invitation.expiresAt < Date.now()) {
      await invitationRef.update({ status: 'expired' })
      return res.status(400).send('Invitation has expired')
    }

    // Verify the accepting user's email matches the invitation
    const userRecord = await getAuth().getUser(userId)
    if (userRecord.email !== invitation.email) {
      return res.status(403).send('This invitation is for a different email address')
    }

    await acceptInvitationInternal(orgId, invitationId, userId, invitation.email)

    return res.status(200).json({ accepted: true, orgId })
  } catch (error) {
    console.error('Failed to accept invitation:', error)
    return res.status(500).send('Failed to accept invitation')
  }
}

export const acceptInvitation = withFirebaseAuth(acceptInvitationBase)

async function acceptInvitationInternal(
  orgId: string,
  invitationId: string,
  userId: string,
  email: string,
) {
  const timestamp = Date.now()
  const invitationRef = firestore.doc(
    `organizations/${orgId}/invitations/${invitationId}`,
  )
  const invitation = (await invitationRef.get()).data()!

  const batch = firestore.batch()

  // Update invitation status
  batch.update(invitationRef, {
    status: 'accepted',
    acceptedAt: timestamp,
    acceptedBy: userId,
  })

  // Add user as org member
  let displayName = ''
  try {
    const userRecord = await getAuth().getUser(userId)
    displayName = userRecord.displayName || ''
  } catch {
    // ignore - display name is optional
  }

  const memberRef = firestore.doc(`organizations/${orgId}/members/${userId}`)
  batch.set(memberRef, {
    role: invitation.role,
    addedAt: timestamp,
    addedBy: invitation.invitedBy,
    email,
    displayName,
  })

  // Add org to user's subcollection
  const orgDoc = await firestore.doc(`organizations/${orgId}`).get()
  const orgData = orgDoc.data()
  const userOrgRef = firestore.doc(`users/${userId}/organizations/${orgId}`)
  batch.set(userOrgRef, {
    name: orgData?.name || '',
    slug: orgData?.slug || '',
    role: invitation.role,
  })

  await batch.commit()
}

// GET /api/orgs/:orgId/invitations
const listInvitationsBase = async (
  req: Request,
  res: Response,
  args: { orgId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const callerMember = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!callerMember.exists) return res.status(403).send('Not a member')

    const invitationsSnapshot = await firestore
      .collection(`organizations/${orgId}/invitations`)
      .orderBy('createdAt', 'desc')
      .get()
    const invitations = invitationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.status(200).json(invitations)
  } catch (error) {
    console.error('Failed to list invitations:', error)
    return res.status(500).send('Failed to list invitations')
  }
}

export const listInvitations = withFirebaseAuth(listInvitationsBase)

// DELETE /api/orgs/:orgId/invitations/:invitationId
const revokeInvitationBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; invitationId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, invitationId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const callerMember = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!callerMember.exists) return res.status(403).send('Not a member')
    const callerRole = callerMember.data()?.role
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only owners and admins can revoke invitations')
    }

    await firestore
      .doc(`organizations/${orgId}/invitations/${invitationId}`)
      .delete()

    return res.status(200).json({ revoked: invitationId })
  } catch (error) {
    console.error('Failed to revoke invitation:', error)
    return res.status(500).send('Failed to revoke invitation')
  }
}

export const revokeInvitation = withFirebaseAuth(revokeInvitationBase)
