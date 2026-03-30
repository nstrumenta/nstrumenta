import { Request, Response } from 'express'
import { firestore } from '../authentication/ServiceAccount'
import { withFirebaseAuth, FirebaseAuthResult } from '../authentication/firebaseAuth'

const INITIAL_CREDIT_CENTS = 2500

// GET /api/orgs/:orgId/billing
const getBillingBase = async (
  req: Request,
  res: Response,
  args: { orgId: string } & FirebaseAuthResult,
) => {
  const { authenticated, userId, orgId } = args
  if (!authenticated || !userId) return res.status(401).send('Authentication required')

  try {
    // Verify caller is owner
    const callerMember = await firestore
      .doc(`organizations/${orgId}/members/${userId}`)
      .get()
    if (!callerMember.exists) return res.status(403).send('Not a member')
    const callerRole = callerMember.data()?.role
    if (callerRole !== 'owner') {
      return res.status(403).send('Only owners can view billing')
    }

    const billingDoc = await firestore
      .doc(`organizations/${orgId}/billing/current`)
      .get()

    if (!billingDoc.exists) {
      // Initialize billing if it doesn't exist (migration case)
      const timestamp = Date.now()
      const defaultBilling = {
        plan: 'free_trial',
        creditBalanceCents: INITIAL_CREDIT_CENTS,
        paymentMethodAttached: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await firestore
        .doc(`organizations/${orgId}/billing/current`)
        .set(defaultBilling)
      return res.status(200).json(defaultBilling)
    }

    // Strip sensitive Stripe fields for the response
    const billing = billingDoc.data()!
    const { stripeCustomerId, stripeSubscriptionId, ...safeBilling } = billing
    return res.status(200).json({
      ...safeBilling,
      hasStripeCustomer: !!stripeCustomerId,
      hasSubscription: !!stripeSubscriptionId,
    })
  } catch (error) {
    console.error('Failed to get billing:', error)
    return res.status(500).send('Failed to get billing')
  }
}

export const getBilling = withFirebaseAuth(getBillingBase)

// GET /api/orgs/:orgId/billing/usage
const getUsageBase = async (
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
    const callerRole = callerMember.data()?.role
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return res.status(403).send('Only owners and admins can view usage')
    }

    const usageSnapshot = await firestore
      .collection(`organizations/${orgId}/billing/current/usage`)
      .orderBy('period', 'desc')
      .limit(12) // last 12 months
      .get()

    const usage = usageSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.status(200).json(usage)
  } catch (error) {
    console.error('Failed to get usage:', error)
    return res.status(500).send('Failed to get usage')
  }
}

export const getUsage = withFirebaseAuth(getUsageBase)

// Server-internal: record a usage event (called by other server code, not an HTTP endpoint)
export async function recordUsageEvent(
  orgId: string,
  event: {
    type: 'api_call' | 'storage' | 'compute' | 'data_transfer'
    amount: number // bytes, seconds, or count depending on type
  },
) {
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const usageRef = firestore.doc(
    `organizations/${orgId}/billing/current/usage/${period}`,
  )

  const fieldMap: Record<string, string> = {
    api_call: 'apiCalls',
    storage: 'storageBytes',
    compute: 'computeSeconds',
    data_transfer: 'dataTransferBytes',
  }

  const field = fieldMap[event.type]
  if (!field) return

  try {
    const { FieldValue } = await import('@google-cloud/firestore')
    await usageRef.set(
      {
        period,
        [field]: FieldValue.increment(event.amount),
        lastUpdated: Date.now(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('Failed to record usage event:', error)
  }
}
