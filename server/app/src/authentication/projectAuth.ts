import { Request, Response } from 'express'
import { auth } from './index'
import { firebaseAuth } from './firebaseAuth'
import { firestore } from './ServiceAccount'
import { orgProjectPath, parseOrgProject } from '../shared/utils'

export type ProjectAuthResult =
  | { authenticated: true; type: 'api-key'; projectId: string; apiKey: string; userId?: never }
  | { authenticated: true; type: 'user'; projectId: string; userId: string; apiKey?: never }

export function withProjectAuth<T>(
  fn: (req: Request, res: Response, args: T & ProjectAuthResult) => Promise<unknown>,
): (req: Request, res: Response) => Promise<unknown> {
  return async function wrapped(req, res) {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', '*')
      res.set('Access-Control-Allow-Headers', '*')
      res.set('Access-Control-Max-Age', '3600')
      return res.status(204).send('')
    }

    // 1. Try API Key Auth
    const apiAuth = await auth(req, res)
    if (apiAuth.authenticated) {
      // If a projectId is explicitly specified in the request, ensure it matches the API Key's scope
      const requestedProjectId = req.params?.projectId || req.body?.projectId || req.query?.projectId
      if (requestedProjectId && requestedProjectId !== apiAuth.projectId) {
        return res.status(403).json({ error: 'API key is not valid for the requested project' })
      }

      const payload = (req.body || {}) as T
      return fn(req, res, { 
        ...payload, 
        authenticated: true, 
        type: 'api-key', 
        projectId: apiAuth.projectId, 
        apiKey: apiAuth.apiKey 
      })
    }

    // 2. Try Firebase User Auth
    const userAuth = await firebaseAuth(req, res)
    if (userAuth.authenticated) {
      // When using user tokens, the request MUST specify which project they are accessing
      const requestedProjectId = req.params?.projectId || req.body?.projectId || req.query?.projectId
      if (!requestedProjectId) {
         return res.status(400).json({ error: 'projectId is required in request when using user authentication' })
      }
      if (typeof requestedProjectId !== 'string') {
         return res.status(400).json({ error: 'projectId must be a string' })
      }

      try {
        parseOrgProject(requestedProjectId)
      } catch {
        return res.status(400).json({ error: 'projectId must be in a valid organization/project format' })
      }

      const projectDoc = await firestore
        .doc(orgProjectPath(requestedProjectId))
        .get()
      const isProjectMember = !!projectDoc.data()?.members?.[userAuth.userId]

      if (!projectDoc.exists || !isProjectMember) {
        return res.status(403).json({ error: 'Not a member of this project' })
      }

      const payload = (req.body || {}) as T
      return fn(req, res, { 
        ...payload, 
        authenticated: true, 
        type: 'user', 
        projectId: requestedProjectId, 
        userId: userAuth.userId 
      })
    }

    // 3. Fallback
    return res.status(401).json({ error: 'Valid Project API key or User token required.' })
  }
}
