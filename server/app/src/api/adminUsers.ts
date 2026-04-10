import { Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

async function requireAdmin(userId: string): Promise<boolean> {
  const userDoc = await firestore.collection('users').doc(userId).get()
  return userDoc.exists && userDoc.data()?.role === 'admin'
}

// POST /api/admin/users/approve
const approveUserBase = async (
  req: Request,
  res: Response,
  args: { email?: string; uid?: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  if (!await requireAdmin(userId)) {
    return res.status(403).send('Admin role required')
  }

  const { email, uid } = args
  if (!email && !uid) return res.status(400).send('email or uid is required')

  try {
    let targetUid = uid
    let targetEmail = email

    if (email && !uid) {
      const userRecord = await getAuth().getUserByEmail(email)
      targetUid = userRecord.uid
      targetEmail = userRecord.email
    } else if (uid && !email) {
      const userRecord = await getAuth().getUser(uid)
      targetEmail = userRecord.email
    }

    await firestore.collection('users').doc(targetUid!).set(
      { status: 'approved' },
      { merge: true },
    )

    return res.status(200).json({ uid: targetUid, email: targetEmail, status: 'approved' })
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).send('User not found')
    }
    console.error('Error approving user:', error)
    return res.status(500).send('Internal server error')
  }
}

export const approveUser = withFirebaseAuth(approveUserBase)

// GET /api/admin/users/pending
const listPendingUsersBase = async (
  req: Request,
  res: Response,
  args: FirebaseAuthResult,
) => {
  const { authenticated, userId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  if (!await requireAdmin(userId)) {
    return res.status(403).send('Admin role required')
  }

  try {
    const snapshot = await firestore
      .collection('users')
      .where('status', '==', 'pending')
      .get()

    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data()
        let email: string | undefined
        try {
          const userRecord = await getAuth().getUser(doc.id)
          email = userRecord.email
        } catch {
          // user may have been deleted from auth
        }
        return { uid: doc.id, email, ...data }
      }),
    )

    return res.status(200).json({ users })
  } catch (error) {
    console.error('Error listing pending users:', error)
    return res.status(500).send('Internal server error')
  }
}

export const listPendingUsers = withFirebaseAuth(listPendingUsersBase)
