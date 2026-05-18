import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockVerifyIdToken, mockGetApps } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockGetApps: vi.fn(() => [{}]),
}))

vi.mock('firebase-admin/app', () => ({
  getApps: mockGetApps,
  initializeApp: vi.fn(),
  applicationDefault: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}))

import { withFirebaseAuth } from '../authentication/firebaseAuth'

function makeRes(): Partial<Response> & {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
} {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  res.set = vi.fn().mockReturnValue(res)
  return res
}

describe('withFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetApps.mockReturnValue([{}])
  })

  it('passes merged query, body, and params to the handler', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-1' })

    const inner = vi.fn().mockResolvedValue(undefined)
    const handler = withFirebaseAuth(inner)
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token-123' },
      query: { includeArchived: 'true' },
      body: { bodyOnly: 'body-value' },
      params: { orgId: 'org-from-path', projectId: 'project-from-path' },
    } as unknown as Request
    const res = makeRes() as Response

    await handler(req, res)

    expect(inner).toHaveBeenCalledWith(
      req,
      res,
      expect.objectContaining({
        authenticated: true,
        userId: 'user-1',
        includeArchived: 'true',
        bodyOnly: 'body-value',
        orgId: 'org-from-path',
        projectId: 'project-from-path',
      }),
    )
  })

  it('lets route params override body values for the same keys', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-2' })

    const inner = vi.fn().mockResolvedValue(undefined)
    const handler = withFirebaseAuth(inner)
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token-456' },
      query: {},
      body: { orgId: 'org-from-body', projectId: 'project-from-body' },
      params: { orgId: 'org-from-path', projectId: 'project-from-path' },
    } as unknown as Request
    const res = makeRes() as Response

    await handler(req, res)

    expect(inner).toHaveBeenCalledWith(
      req,
      res,
      expect.objectContaining({
        orgId: 'org-from-path',
        projectId: 'project-from-path',
      }),
    )
  })
})