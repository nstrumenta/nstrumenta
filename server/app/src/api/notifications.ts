import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

// PATCH /api/notifications/:notificationId — mark as read
const markNotificationReadBase = async (
  req: Request,
  res: Response,
  args: { notificationId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, notificationId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const ref = firestore.doc(`users/${userId}/notifications/${notificationId}`)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).send('Notification not found')

    await ref.update({ read: true })
    return res.status(200).json({ notificationId, read: true })
  } catch (error) {
    console.error('Failed to mark notification read:', error)
    return res.status(500).send('Failed to mark notification read')
  }
}

export const markNotificationRead = withFirebaseAuth(markNotificationReadBase)

// DELETE /api/notifications/:notificationId — dismiss notification
const deleteNotificationBase = async (
  req: Request,
  res: Response,
  args: { notificationId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, notificationId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    const ref = firestore.doc(`users/${userId}/notifications/${notificationId}`)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).send('Notification not found')

    await ref.delete()
    return res.status(200).json({ deleted: notificationId })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return res.status(500).send('Failed to delete notification')
  }
}

export const deleteNotification = withFirebaseAuth(deleteNotificationBase)
