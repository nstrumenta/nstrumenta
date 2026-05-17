import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockCollectionGet, mockDocGet, mockFirestoreCollection, mockFirestoreDoc } = vi.hoisted(() => {
  const mockCollectionGet = vi.fn()
  const mockDocGet = vi.fn()

  const mockFirestoreCollection = vi.fn((path: string) => ({
    get: () => mockCollectionGet(path),
  }))

  const mockFirestoreDoc = vi.fn((path: string) => ({
    get: () => mockDocGet(path),
  }))

  return {
    mockCollectionGet,
    mockDocGet,
    mockFirestoreCollection,
    mockFirestoreDoc,
  }
})

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    collection: mockFirestoreCollection,
    doc: mockFirestoreDoc,
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

  it('lists projects from org memberships and project membership index', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockCollectionGet.mockImplementation(async (path: string) => {
      if (path === 'users/user-1/organizations') {
        return { docs: [{ id: 'org1' }] }
      }
      if (path === 'users/user-1/projects') {
        return { docs: [{ data: () => ({ projectId: 'org2/proj2' }) }] }
      }
      if (path === 'organizations/org1/projects') {
        return {
          docs: [
            {
              data: () => ({ name: 'Project One', orgSlug: 'org1', slug: 'proj1', members: { 'user-1': 'owner' }, lastOpened: 50 }),
              id: 'proj1',
              ref: { parent: { parent: { id: 'org1' } } },
            },
          ],
        }
      }
      return { docs: [] }
    })

    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ name: 'Project Two', orgSlug: 'org2', slug: 'proj2', members: { 'user-1': 'admin' }, lastOpened: 100 }),
    })

    await (listUserProjects as any)(req, res, {
      authenticated: true,
      userId: 'user-1',
    })

    expect(mockFirestoreCollection).toHaveBeenCalledWith('users/user-1/organizations')
    expect(mockFirestoreCollection).toHaveBeenCalledWith('users/user-1/projects')
    expect(mockFirestoreCollection).toHaveBeenCalledWith('organizations/org1/projects')
    expect(mockFirestoreDoc).toHaveBeenCalledWith('organizations/org2/projects/proj2')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'org2/proj2', orgSlug: 'org2', slug: 'proj2', name: 'Project Two' }),
      expect.objectContaining({ id: 'org1/proj1', orgSlug: 'org1', slug: 'proj1', name: 'Project One' }),
    ])
  })

  it('deduplicates projects returned from org and index lookups', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockCollectionGet.mockImplementation(async (path: string) => {
      if (path === 'users/user-1/organizations') {
        return { docs: [{ id: 'org1' }] }
      }
      if (path === 'users/user-1/projects') {
        return { docs: [{ data: () => ({ projectId: 'org1/proj1' }) }] }
      }
      if (path === 'organizations/org1/projects') {
        return {
          docs: [
            {
              data: () => ({ name: 'Project One', orgSlug: 'org1', slug: 'proj1', members: { 'user-1': 'owner' }, lastOpened: 50 }),
              id: 'proj1',
              ref: { parent: { parent: { id: 'org1' } } },
            },
          ],
        }
      }
      return { docs: [] }
    })

    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ name: 'Project One', orgSlug: 'org1', slug: 'proj1', members: { 'user-1': 'owner' }, lastOpened: 50 }),
    })

    await (listUserProjects as any)(req, res, {
      authenticated: true,
      userId: 'user-1',
    })

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'org1/proj1', name: 'Project One' }),
    ])
  })
})