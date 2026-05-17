import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockCollectionGroup, mockWhere, mockGet } = vi.hoisted(() => {
  const mockGet = vi.fn()
  const mockWhere = vi.fn(() => ({ get: mockGet }))
  const mockCollectionGroup = vi.fn(() => ({ where: mockWhere }))

  return {
    mockCollectionGroup,
    mockWhere,
    mockGet,
  }
})

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    collectionGroup: mockCollectionGroup,
  },
}))

vi.mock('../authentication/firebaseAuth', () => ({
  withFirebaseAuth: (fn: any) => fn,
}))

import { listUserProjects } from '../api/userProjects'

function makeRes(): any {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('user projects api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists projects based on project membership across organizations', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockGet
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({ name: 'Project One', orgSlug: 'org1', slug: 'proj1', members: { 'user-1': 'owner' }, lastOpened: 50 }),
            id: 'proj1',
            ref: { parent: { parent: { id: 'org1' } } },
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({ name: 'Project Two', orgSlug: 'org2', slug: 'proj2', members: { 'user-1': 'admin' }, lastOpened: 100 }),
            id: 'proj2',
            ref: { parent: { parent: { id: 'org2' } } },
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] })

    await (listUserProjects as any)(req, res, {
      authenticated: true,
      userId: 'user-1',
    })

    expect(mockCollectionGroup).toHaveBeenCalledWith('projects')
    expect(mockWhere).toHaveBeenNthCalledWith(1, 'members.user-1', '==', 'owner')
    expect(mockWhere).toHaveBeenNthCalledWith(2, 'members.user-1', '==', 'admin')
    expect(mockWhere).toHaveBeenNthCalledWith(3, 'members.user-1', '==', 'viewer')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'org2/proj2', orgSlug: 'org2', slug: 'proj2', name: 'Project Two' }),
      expect.objectContaining({ id: 'org1/proj1', orgSlug: 'org1', slug: 'proj1', name: 'Project One' }),
    ])
  })

  it('deduplicates projects returned from multiple role queries', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response
    const sharedDoc = {
      data: () => ({ name: 'Shared', orgSlug: 'org1', slug: 'proj1', members: { 'user-1': 'owner' } }),
      id: 'proj1',
      ref: { parent: { parent: { id: 'org1' } } },
    }

    mockGet
      .mockResolvedValueOnce({ docs: [sharedDoc] })
      .mockResolvedValueOnce({ docs: [sharedDoc] })
      .mockResolvedValueOnce({ docs: [] })

    await (listUserProjects as any)(req, res, {
      authenticated: true,
      userId: 'user-1',
    })

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'org1/proj1', name: 'Shared' }),
    ])
  })
})