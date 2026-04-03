import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'
import { getAuth } from 'firebase-admin/auth'

const RESERVED_WORDS = new Set([
  'admin', 'settings', 'new', 'waitlist', 'login', 'signup',
  'api', 'mcp', 'oauth', 'health', 'config', 'assets', '_'
])

const USERNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

const INITIAL_CREDIT_CENTS = 2500

const initUserBase = async (
  req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  const userRef = firestore.doc(`users/${userId}`)
  const snapshot = await userRef.get()
  const existing = snapshot.data()

  if (snapshot.exists && existing?.['status']) {
    return res.status(200).json(existing)
  }

  const authUser = await getAuth().getUser(userId)
  const userData = {
    email: authUser.email ?? '',
    displayName: authUser.displayName ?? '',
    status: 'pending',
    createdAt: existing?.['createdAt'] ?? Date.now(),
  }
  await userRef.set(userData, { merge: true })
  return res.status(snapshot.exists ? 200 : 201).json({ ...existing, ...userData })
}

export const initUser = withFirebaseAuth(initUserBase)

const setupUsernameBase = async (
  req: Request,
  res: Response,
  args: { username: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, username } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')
  if (!username) return res.status(400).send('username is required')

  const normalizedUsername = username.toLowerCase()

  if (normalizedUsername.length < 2 || normalizedUsername.length > 39) {
    return res.status(400).send('Username must be between 2 and 39 characters')
  }

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return res.status(400).send('Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen')
  }

  if (RESERVED_WORDS.has(normalizedUsername)) {
    return res.status(400).send('Username is a reserved word')
  }

  try {
    const orgId = firestore.collection('organizations').doc().id

    await firestore.runTransaction(async (transaction) => {
      const slugRef = firestore.doc(`slugs/${normalizedUsername}`)
      const slugDoc = await transaction.get(slugRef)

      if (slugDoc.exists) {
        throw new Error('USERNAME_TAKEN')
      }

      // 1. Claim the slug
      transaction.set(slugRef, {
        type: 'user',
        id: userId,
      })

      // 2. Create the personal organization
      const timestamp = Date.now()
      const orgRef = firestore.doc(`organizations/${orgId}`)
      transaction.set(orgRef, {
        name: normalizedUsername,
        slug: normalizedUsername,
        type: 'personal',
        createdAt: timestamp,
        createdBy: userId,
      })

      // 3. Add user as owner of the org
      const memberRef = firestore.doc(`organizations/${orgId}/members/${userId}`)
      transaction.set(memberRef, {
        role: 'owner',
        addedAt: timestamp,
        addedBy: userId,
      })

      // 4. Initialize billing
      const billingRef = firestore.doc(`organizations/${orgId}/billing/current`)
      transaction.set(billingRef, {
        plan: 'free_trial',
        creditBalanceCents: INITIAL_CREDIT_CENTS,
        paymentMethodAttached: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      // 5. Add org reference to user subcollection (for listUserOrgs)
      const userOrgRef = firestore.doc(`users/${userId}/organizations/${orgId}`)
      transaction.set(userOrgRef, {
        name: normalizedUsername,
        slug: normalizedUsername,
        role: 'owner',
      })

      // 6. Update the user document
      const userRef = firestore.doc(`users/${userId}`)
      transaction.set(userRef, {
        username: normalizedUsername,
        personalOrgId: orgId,
      }, { merge: true })
    })

    return res.status(200).json({ 
      username: normalizedUsername,
      personalOrgId: orgId 
    })
  } catch (error: any) {
    if (error.message === 'USERNAME_TAKEN') {
      return res.status(409).send('Username is already taken')
    }
    console.error('Failed to setup username:', error)
    return res.status(500).send('Internal server error')
  }
}

export const setupUsername = withFirebaseAuth(setupUsernameBase)
