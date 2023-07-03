import crypto from 'crypto'
import Firestore from '@google-cloud/firestore'
import fs from 'fs'
import { Request, Response } from 'express'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))
// @ts-ignore
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

export type AuthResult =
  | { authenticated: false; projectId: string; message?: string }
  | { authenticated: true; projectId: string; message?: string }

export type WrappedArgs<TArgs> = AuthResult & TArgs

export type APIEndpointNoAuth<TArgs> = (
  req: Request,
  res: Response,
  args: TArgs,
) => Promise<unknown>
export type APIEndpoint<TArgs> = (
  req: Request,
  res: Response,
  args: WrappedArgs<TArgs>,
) => Promise<unknown>
export type AuthFunction = (req: Request, res: Response) => Promise<AuthResult>
export type InternalEndpoint = (req: Request, res: Response) => Promise<unknown>

export const auth: AuthFunction = async (req, res) => {
  const key = req.headers['x-api-key'] as string

  if (!key)
    return { authenticated: false, message: 'missing key', projectId: '' }

  try {
    const hash = createHash(key)
    const doc = await firestore.collection('keys').doc(hash).get()

    if (!doc.exists || !doc.data().projectId) {
      return { authenticated: false, message: 'no', projectId: '' }
    }

    // intentionally do not await for usage update
    const lastUsed = Date.now()
    firestore.collection('keys').doc(hash).set({ lastUsed }, { merge: true })
    firestore.collection('keys').doc(hash).collection('usage').add({
      timestamp: lastUsed,
      ip: req.ip,
    })

    return { authenticated: true, projectId: doc.data().projectId }
  } catch (error) {
    console.log(error)
    return { authenticated: false, message: 'error', projectId: '' }
  }
}

export function withAuth<T>(
  fn: APIEndpointNoAuth<WrappedArgs<T>>,
): APIEndpoint<T> {
  return async function wrapped(req, res, args) {
    // preflight CORS
    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', '*')
      res.set('Access-Control-Allow-Headers', '*')
      res.set('Access-Control-Max-Age', '3600')
      console.log('CORS', res)
      return res.status(204).send('')
    }

    const authentication = await auth(req, res)

    if (!authentication.authenticated) {
      return res.status(401).send('not authenticated')
    }
    return fn(req, res, { ...args, ...authentication })
  }
}

function createHash(key: string) {
  return crypto.createHash('sha256').update(key).update('salt').digest('hex')
}
