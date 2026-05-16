import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const {
  mockGetUserByEmail,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetUserByEmail: vi.fn(),
  mockGetUser: vi.fn(),
}))

const {
  mockDocGet,
  mockDocSet,
  mockDocUpdate,
  mockCollectionGet,
  mockCollectionDocSet,
  mockCollectionDocDelete,
  mockFirestoreDoc,
  mockFirestoreCollection,
} = vi.hoisted(() => {
  const mockDocGet = vi.fn()
  const mockDocSet = vi.fn().mockResolvedValue(undefined)
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)
  const mockCollectionGet = vi.fn()
  const mockCollectionDocSet = vi.fn().mockResolvedValue(undefined)
  const mockCollectionDocUpdate = vi.fn().mockResolvedValue(undefined)
  const mockCollectionDocDelete = vi.fn().mockResolvedValue(undefined)

  const mockFirestoreDoc = vi.fn((path: string) => ({
    get: () => mockDocGet(path),
    set: (data: unknown) => mockDocSet(path, data),
    update: (data: unknown) => mockDocUpdate(path, data),
  }))

  const mockFirestoreCollection = vi.fn((path: string) => ({
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: () => mockCollectionGet(path),
    doc: vi.fn((docId?: string) => ({
      id: docId ?? 'invite-123',
      set: (data: unknown) => mockCollectionDocSet(path, data),
      update: (data: unknown) => mockCollectionDocUpdate(path, data),
      delete: () => mockCollectionDocDelete(path, docId),
    })),
  }))

  return {
    mockDocGet,
    mockDocSet,
    mockDocUpdate,
    mockCollectionGet,
    mockCollectionDocSet,
    mockCollectionDocDelete,
    mockFirestoreDoc,
    mockFirestoreCollection,
  }
})

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUserByEmail: mockGetUserByEmail,
    getUser: mockGetUser,
  }),
}))

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    doc: mockFirestoreDoc,
    collection: mockFirestoreCollection,
  },
}))

vi.mock('../authentication/firebaseAuth', () => ({
  withFirebaseAuth: (fn: any) => fn,
}))

import { inviteProjectMember, acceptProjectInvitation } from '../api/invitations'

function makeRes(): any {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}

describe('project invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollectionGet.mockResolvedValue({ empty: true, docs: [] })
  })

  it('returns 403 when caller is not a project admin', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({ members: { caller1: 'viewer' } }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (inviteProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'caller1',
      orgId: 'org1',
      projectId: 'proj1',
      email: 'new@example.com',
      role: 'viewer',
    })

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('creates pending invitation and notifies existing user', async () => {
    const req = { body: {}, headers: { origin: 'https://app.example.com' } } as Request
    const res = makeRes() as Response

    mockGetUserByEmail.mockResolvedValue({ uid: 'user-2' })
    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({ members: { caller1: 'admin' } }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (inviteProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'caller1',
      orgId: 'org1',
      projectId: 'proj1',
      email: 'existing@example.com',
      role: 'viewer',
    })

    expect(mockDocSet).toHaveBeenCalledWith(
      'users/user-2/notifications/invite-123',
      expect.objectContaining({
        type: 'project_invitation_pending',
        projectId: 'org1/proj1',
        invitationId: 'invite-123',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      existingUser: true,
      requiresEmailBootstrap: false,
      firebaseEmailLink: expect.objectContaining({
        email: 'existing@example.com',
        continueUrl: expect.stringContaining('/accept-invite?'),
        handleCodeInApp: true,
      }),
    }))
  })

  it('reuses an existing pending invitation as a resend', async () => {
    const req = { body: {}, headers: { origin: 'https://app.example.com' } } as Request
    const res = makeRes() as Response

    mockGetUserByEmail.mockResolvedValue({ uid: 'user-2' })
    mockCollectionGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'invite-existing',
          data: () => ({
            email: 'existing@example.com',
            role: 'viewer',
            status: 'pending',
          }),
        },
      ],
    })
    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({ members: { caller1: 'admin' } }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (inviteProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'caller1',
      orgId: 'org1',
      projectId: 'proj1',
      email: 'existing@example.com',
      role: 'admin',
    })

    expect(mockDocUpdate).toHaveBeenCalledWith(
      'organizations/org1/projects/proj1/invitations/invite-existing',
      expect.objectContaining({
        email: 'existing@example.com',
        role: 'admin',
        status: 'pending',
      }),
    )
    expect(mockDocSet).toHaveBeenCalledWith(
      'users/user-2/notifications/invite-existing',
      expect.objectContaining({
        invitationId: 'invite-existing',
        role: 'admin',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      invitationId: 'invite-existing',
      existingUser: true,
      requiresEmailBootstrap: false,
      firebaseEmailLink: expect.objectContaining({
        email: 'existing@example.com',
        continueUrl: expect.stringContaining('/accept-invite?'),
        handleCodeInApp: true,
      }),
    }))
  })

  it('returns Firebase email bootstrap config for new-user project invitations', async () => {
    const req = { body: {}, headers: { origin: 'https://app.example.com' } } as Request
    const res = makeRes() as Response

    mockGetUserByEmail.mockRejectedValue(new Error('not found'))
    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({ members: { caller1: 'admin' } }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (inviteProjectMember as any)(req, res, {
      authenticated: true,
      userId: 'caller1',
      orgId: 'org1',
      projectId: 'proj1',
      email: 'new@example.com',
      role: 'viewer',
    })

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      existingUser: false,
      requiresEmailBootstrap: true,
      firebaseEmailLink: expect.objectContaining({
        email: 'new@example.com',
        continueUrl: expect.stringContaining('/accept-invite?'),
        handleCodeInApp: true,
      }),
    }))
  })

  it('accepts project invitation when user email matches', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockGetUser.mockResolvedValue({ email: 'invited@example.com' })
    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1/invitations/invite-1') {
        return {
          exists: true,
          data: () => ({
            email: 'invited@example.com',
            role: 'viewer',
            status: 'pending',
            expiresAt: Date.now() + 60_000,
          }),
        }
      }
      if (path === 'organizations/org1/projects/proj1') {
        return {
          exists: true,
          data: () => ({ members: { admin1: 'admin' } }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (acceptProjectInvitation as any)(req, res, {
      authenticated: true,
      userId: 'user-2',
      orgId: 'org1',
      projectId: 'proj1',
      invitationId: 'invite-1',
    })

    expect(mockDocUpdate).toHaveBeenCalledWith(
      'organizations/org1/projects/proj1',
      expect.objectContaining({
        members: expect.objectContaining({ 'user-2': 'viewer' }),
      }),
    )
    expect(mockDocUpdate).toHaveBeenCalledWith(
      'organizations/org1/projects/proj1/invitations/invite-1',
      expect.objectContaining({ status: 'accepted', acceptedBy: 'user-2' }),
    )
    expect(mockCollectionDocDelete).toHaveBeenCalledWith(
      'users/user-2/notifications',
      'invite-1',
    )
    expect(mockCollectionDocSet).toHaveBeenCalledWith(
      'users/user-2/notifications',
      expect.objectContaining({
        type: 'project_membership_added',
        projectId: 'org1/proj1',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rejects project invitation acceptance when user email does not match', async () => {
    const req = { body: {} } as Request
    const res = makeRes() as Response

    mockGetUser.mockResolvedValue({ email: 'other@example.com' })
    mockDocGet.mockImplementation(async (path: string) => {
      if (path === 'organizations/org1/projects/proj1/invitations/invite-1') {
        return {
          exists: true,
          data: () => ({
            email: 'invited@example.com',
            role: 'viewer',
            status: 'pending',
            expiresAt: Date.now() + 60_000,
          }),
        }
      }
      return { exists: false, data: () => ({}) }
    })

    await (acceptProjectInvitation as any)(req, res, {
      authenticated: true,
      userId: 'user-2',
      orgId: 'org1',
      projectId: 'proj1',
      invitationId: 'invite-1',
    })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockDocUpdate).not.toHaveBeenCalledWith(
      'organizations/org1/projects/proj1',
      expect.anything(),
    )
  })
})
