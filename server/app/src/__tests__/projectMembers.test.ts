import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { mockDocGet, mockDocUpdate, mockFirestoreDoc } = vi.hoisted(() => {
  const mockDocGet = vi.fn()
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)

  const mockFirestoreDoc = vi.fn((path: string) => ({
    get: () => mockDocGet(path),
    update: (data: unknown) => mockDocUpdate(path, data),
  }))

  return {
    mockDocGet,
    mockDocUpdate,
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

import { removeProjectMember, updateProjectMemberRole } from '../api/projectMembers'

function makeRes(): any {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('project members api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects admin removing owner', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({
            members: {
              admin1: 'admin',
              owner1: 'owner',
            },
          }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (removeProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'admin1',
      orgId: 'org1',
      projectId: 'proj1',
      memberId: 'owner1',
    })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockDocUpdate).not.toHaveBeenCalled()
  })

  it('allows owner removing non-owner', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({
            members: {
              owner1: 'owner',
              viewer1: 'viewer',
            },
          }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (removeProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'owner1',
      orgId: 'org1',
      projectId: 'proj1',
      memberId: 'viewer1',
    })

    expect(mockDocUpdate).toHaveBeenCalledWith(
      'organizations/org1/projects/proj1',
      expect.objectContaining({
        members: {
          owner1: 'owner',
        },
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rejects demoting the last owner', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({
            members: {
              owner1: 'owner',
              admin1: 'admin',
            },
          }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (updateProjectMemberRole as any)(req, res, {
      authenticated: true,
      userId: 'owner1',
      orgId: 'org1',
      projectId: 'proj1',
      memberId: 'owner1',
      role: 'admin',
    })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockDocUpdate).not.toHaveBeenCalled()
  })

  it('allows owner to promote viewer to admin', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({
            members: {
              owner1: 'owner',
              viewer1: 'viewer',
            },
          }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (updateProjectMemberRole as any)(req, res, {
      authenticated: true,
      userId: 'owner1',
      orgId: 'org1',
      projectId: 'proj1',
      memberId: 'viewer1',
      role: 'admin',
    })

    expect(mockDocUpdate).toHaveBeenCalledWith(
      'organizations/org1/projects/proj1',
      expect.objectContaining({
        members: {
          owner1: 'owner',
          viewer1: 'admin',
        },
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
