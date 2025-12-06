import { Request, Response } from 'express'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { serviceAccount } from './ServiceAccount'

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  })
}

export type FirebaseAuthResult =
  | { authenticated: false; userId?: string; message?: string }
  | { authenticated: true; userId: string; message?: string }

export type APIEndpointWithFirebaseAuth<TArgs> = (
  req: Request,
  res: Response,
  args: TArgs & FirebaseAuthResult,
) => Promise<unknown>

export const firebaseAuth = async (req: Request, res: Response): Promise<FirebaseAuthResult> => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, message: 'Missing or invalid authorization header' }
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken)
    return { authenticated: true, userId: decodedToken.uid }
  } catch (error) {
    console.error('Firebase auth error:', error)
    return { authenticated: false, message: 'Invalid Firebase token' }
  }
}

export function withFirebaseAuth<T>(
  fn: (req: Request, res: Response, args: T & FirebaseAuthResult) => Promise<unknown>,
): (req: Request, res: Response) => Promise<unknown> {
  return async function wrapped(req, res) {
    // preflight CORS
    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', '*')
      res.set('Access-Control-Allow-Headers', '*')
      res.set('Access-Control-Max-Age', '3600')
      return res.status(204).send('')
    }

    const authentication = await firebaseAuth(req, res)

    if (!authentication.authenticated) {
      return res.status(401).send(authentication.message || 'Authentication failed')
    }

    // Extract args from request body
    const args = req.body as T

    return fn(req, res, { ...args, ...authentication })
  }
}
