import crypto from 'crypto'
import { Request, Response } from 'express'
import { firestore } from './ServiceAccount'

export type AuthResult =
  | { authenticated: false; projectId: string; message?: string }
  | { authenticated: true; projectId: string; apiKey: string; message?: string }

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
  const key = extractApiKey(req)

  if (!key)
    return { authenticated: false, message: 'missing key', projectId: '' }

  try {
    const rawKey = key.split(':')[0]
    let docId: string
    let isV2 = false

    // Check if it's a V2 key (48 chars hex)
    if (rawKey.length === 48 && /^[0-9a-f]+$/i.test(rawKey)) {
      docId = rawKey.substring(0, 16)
      isV2 = true
    } else {
      // Legacy key
      docId = createHash(rawKey)
    }

    const docData = await (
      await firestore.collection('keys').doc(docId).get()
    ).data()

    if (docData == undefined) {
      return { authenticated: false, message: 'no', projectId: '' }
    }

    // Verify V2 key hash
    if (isV2) {
      if (docData.version !== 'v2' || !docData.salt || !docData.hash) {
        return { authenticated: false, message: 'invalid key version', projectId: '' }
      }

      const secretAccessKey = rawKey.substring(16)
      const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || ''
      const hash = crypto
        .scryptSync(secretAccessKey, docData.salt + pepper, 64)
        .toString('hex')

      if (hash !== docData.hash) {
        return { authenticated: false, message: 'invalid key', projectId: '' }
      }
    }

    const lastUsed = Date.now()
    const projectPath = `projects/${docData.projectId}`
    
    firestore.doc(projectPath).update({
      [`apiKeys.${docId}.lastUsed`]: lastUsed
    })

    return { authenticated: true, projectId: docData.projectId, apiKey: key }
  } catch (error) {
    console.log(error)
    return { authenticated: false, message: 'error', projectId: '' }
  }
}

function extractApiKey(req: Request): string | undefined {
  const headerKey = req.headers['x-api-key']
  if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
    return headerKey.trim()
  }

  const authHeader = req.headers['authorization']
  if (typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ')
    if (scheme?.toLowerCase() === 'bearer' && token?.trim()) {
      return token.trim()
    }
  }

  return undefined
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
  // Legacy SHA256 hash for existing keys
  return crypto.createHash('sha256').update(key).update('salt').digest('hex')
}
