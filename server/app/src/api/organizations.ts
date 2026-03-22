import { Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

const INITIAL_CREDIT_CENTS = 2500

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await firestore
      .collection('organizations')
      .where('slug', '==', slug)
      .limit(1)
      .get()
    if (existing.empty) return slug
    attempt++
    slug = `${baseSlug}-${attempt}`
  }
}

// POST /api/orgs
const createOrgBase = async (
  req: Request,
  res: Response,
  args: { name: string; slug?: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, name, slug: requestedSlug } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')
  if (!name) return res.status(400).send('name is required')

  try {
    const baseSlug = requestedSlug ? slugify(requestedSlug) : slugify(name)
    const slug = await findUniqueSlug(baseSlug)
    const timestamp = Date.now()

    const orgRef = firestore.collection('organizations').doc()
    const orgId = orgRef.id

    const batch = firestore.batch()

    batch.set(orgRef, {
      name,
      slug,
      createdAt: timestamp,
      createdBy: userId,
    })

    // Add creator as owner
    const memberRef = orgRef.collection('members').doc(userId)
    const userRecord = await getAuth().getUser(userId)
    batch.set(memberRef, {
      role: 'owner',
      addedAt: timestamp,
      addedBy: userId,
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
    })

    // Initialize billing with free credits
    const billingRef = orgRef.collection('billing').doc('current')
    batch.set(billingRef, {
      plan: 'free_trial',
      creditBalanceCents: INITIAL_CREDIT_CENTS,
      paymentMethodAttached: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    // Add org reference to user's document
    const userOrgRef = firestore.doc(`users/${userId}/organizations/${orgId}`)
    batch.set(userOrgRef, { name, slug, role: 'owner' })

    await batch.commit()

    return res.status(201).json({ orgId, name, slug })
  } catch (error) {
    console.error('Failed to create organization:', error)
    return res.status(500).send('Failed to create organization')
  }
}

export const createOrg = withFirebaseAuth(createOrgBase)

// GET /api/orgs/:orgId
const getOrgBase = async (
  req: Request,
  res: Response,
  args: { orgId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    // Verify membership
    const memberDoc = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!memberDoc.exists) return res.status(403).send('Not a member of this organization')

    const orgDoc = await firestore.doc(`organizations/${orgId}`).get()
    if (!orgDoc.exists) return res.status(404).send('Organization not found')

    return res.status(200).json({ id: orgId, ...orgDoc.data() })
  } catch (error) {
    console.error('Failed to get organization:', error)
    return res.status(500).send('Failed to get organization')
  }
}

export const getOrg = withFirebaseAuth(getOrgBase)

// GET /api/orgs/:orgId/members
const listOrgMembersBase = async (
  req: Request,
  res: Response,
  args: { orgId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const memberDoc = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!memberDoc.exists) return res.status(403).send('Not a member of this organization')

    const membersSnapshot = await firestore
      .collection(`organizations/${orgId}/members`)
      .get()
    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.status(200).json(members)
  } catch (error) {
    console.error('Failed to list org members:', error)
    return res.status(500).send('Failed to list members')
  }
}

export const listOrgMembers = withFirebaseAuth(listOrgMembersBase)

// DELETE /api/orgs/:orgId/members/:memberId
const removeOrgMemberBase = async (
  req: Request,
  res: Response,
  args: { orgId: string; memberId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId, memberId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const callerMember = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!callerMember.exists) return res.status(403).send('Not a member')
    const callerRole = callerMember.data()?.role
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only owners and admins can remove members')
    }

    // Prevent removing the last owner
    if (memberId !== userId) {
      const targetMember = await firestore
        .doc(`organizations/${orgId}/members/${memberId}`)
        .get()
      if (!targetMember.exists) return res.status(404).send('Member not found')
    }

    const batch = firestore.batch()
    batch.delete(firestore.doc(`organizations/${orgId}/members/${memberId}`))
    batch.delete(firestore.doc(`users/${memberId}/organizations/${orgId}`))
    await batch.commit()

    return res.status(200).json({ removed: memberId })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return res.status(500).send('Failed to remove member')
  }
}

export const removeOrgMember = withFirebaseAuth(removeOrgMemberBase)
