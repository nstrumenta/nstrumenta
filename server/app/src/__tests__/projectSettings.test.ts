import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockDocGet, mockFirestoreDoc } = vi.hoisted(() => {
  const mockDocGet = vi.fn()
  const mockFirestoreDoc = vi.fn((path: string) => ({
    get: () => mockDocGet(path),
  }))

  return {
    mockDocGet,
    mockFirestoreDoc,
  }
})

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    doc: mockFirestoreDoc,
  },
}))

vi.mock('../authentication/firebaseAuth', () => ({
  withFirebaseAuth: (fn: any) => fn,
}))

import { getProjectSettings } from '../api/projectSettings'

function makeRes(): any {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('project settings api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sanitized project settings for members', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        name: 'Project One',
        orgSlug: 'org1',
        slug: 'proj1',
        visibility: 'private',
        members: { 'user-1': 'owner' },
        apiKeys: { abc: { createdAt: '2026-01-01T00:00:00.000Z' } },
        keyFile: { secret: true },
      }),
    })

    await (getProjectSettings as any)(req, res, {
      authenticated: true,
      userId: 'user-1',
      orgId: 'org1',
      projectId: 'proj1',
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 'org1/proj1',
      name: 'Project One',
      apiKeys: { abc: { createdAt: '2026-01-01T00:00:00.000Z' } },
    }))
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ keyFile: expect.anything() }))
  })

  it('returns a public summary for non-members on public projects', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        name: 'Public Project',
        orgSlug: 'org1',
        slug: 'proj1',
        visibility: 'public',
        members: { owner1: 'owner' },
        apiKeys: { abc: { createdAt: '2026-01-01T00:00:00.000Z' } },
      }),
    })

    await (getProjectSettings as any)(req, res, {
      authenticated: true,
      userId: 'user-2',
      orgId: 'org1',
      projectId: 'proj1',
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      id: 'org1/proj1',
      name: 'Public Project',
      slug: 'proj1',
      orgSlug: 'org1',
      visibility: 'public',
    })
  })
})