import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockAuthFn, mockFirebaseAuthFn } = vi.hoisted(() => ({
  mockAuthFn: vi.fn(),
  mockFirebaseAuthFn: vi.fn(),
}))

const { mockDocGet, mockDocFn } = vi.hoisted(() => {
  const mockDocGet = vi.fn()
  const mockDocFn = vi.fn(() => ({ get: mockDocGet }))
  return { mockDocGet, mockDocFn }
})

vi.mock('../authentication/index', () => ({ auth: mockAuthFn }))
vi.mock('../authentication/firebaseAuth', () => ({ firebaseAuth: mockFirebaseAuthFn }))
vi.mock('../authentication/ServiceAccount', () => ({
  firestore: { doc: mockDocFn },
}))

import { withProjectAuth } from '../authentication/projectAuth'

function makeRes(): Partial<Response> & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  res.set = vi.fn().mockReturnValue(res)
  return res
}

function makeReq(overrides: Partial<Request> = {}): Partial<Request> {
  return { headers: {}, body: {}, method: 'POST', params: {}, query: {}, ...overrides }
}

describe('withProjectAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CORS preflight', () => {
    it('returns 204 for OPTIONS', async () => {
      const handler = withProjectAuth(vi.fn())
      const req = makeReq({ method: 'OPTIONS' })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalledWith('')
    })
  })

  describe('API key authentication', () => {
    it('calls the handler when API key authenticates and no projectId in request', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: true, projectId: 'org/proj', apiKey: 'k1' })
      const inner = vi.fn().mockResolvedValue(undefined)
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: {} })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(inner).toHaveBeenCalledWith(
        req,
        res,
        expect.objectContaining({ authenticated: true, type: 'api-key', projectId: 'org/proj' }),
      )
    })

    it('calls the handler when API key projectId matches request projectId', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: true, projectId: 'org/proj', apiKey: 'k1' })
      const inner = vi.fn().mockResolvedValue(undefined)
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'org/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(inner).toHaveBeenCalled()
    })

    it('returns 403 when API key projectId does not match request projectId', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: true, projectId: 'org/proj', apiKey: 'k1' })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'other/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(inner).not.toHaveBeenCalled()
    })
  })

  describe('Firebase user authentication', () => {
    it('returns 400 when projectId is missing', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: {} })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(inner).not.toHaveBeenCalled()
    })

    it('returns 400 for invalid projectId format', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'notslashed' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(inner).not.toHaveBeenCalled()
    })

    it('returns 400 for projectId with more than one slash', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'a/b/c' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(inner).not.toHaveBeenCalled()
    })

    it('returns 403 when project does not exist', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      mockDocGet.mockResolvedValue({ exists: false, data: () => undefined })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'org/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(inner).not.toHaveBeenCalled()
    })

    it('returns 403 when user is not in project members map', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      mockDocGet.mockResolvedValue({ exists: true, data: () => ({ members: { user2: true } }) })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'org/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(inner).not.toHaveBeenCalled()
    })

    it('calls the handler when user is a project member', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user1' })
      mockDocGet.mockResolvedValue({ exists: true, data: () => ({ members: { user1: true } }) })
      const inner = vi.fn().mockResolvedValue(undefined)
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'org/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(inner).toHaveBeenCalledWith(
        req,
        res,
        expect.objectContaining({ authenticated: true, type: 'user', projectId: 'org/proj', userId: 'user1' }),
      )
    })
  })

  describe('unauthenticated', () => {
    it('returns 401 when neither auth method succeeds', async () => {
      mockAuthFn.mockResolvedValue({ authenticated: false })
      mockFirebaseAuthFn.mockResolvedValue({ authenticated: false })
      const inner = vi.fn()
      const handler = withProjectAuth(inner)
      const req = makeReq({ body: { projectId: 'org/proj' } })
      const res = makeRes()
      await handler(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(inner).not.toHaveBeenCalled()
    })
  })
})
