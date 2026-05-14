import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const {
  mockGetUserByEmail,
  mockGetUser,
  mockGenerateSignInWithEmailLink,
} = vi.hoisted(() => ({
  mockGetUserByEmail: vi.fn(),
  mockGetUser: vi.fn(),
  mockGenerateSignInWithEmailLink: vi.fn(),
}))

const {
  mockDocGet,
  mockDocSet,
  mockDocUpdate,
  mockCollectionGet,
  mockCollectionDocSet,
  mockFirestoreDoc,
  mockFirestoreCollection,
} = vi.hoisted(() => {
  const mockDocGet = vi.fn()
  const mockDocSet = vi.fn().mockResolvedValue(undefined)
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined)
  const mockCollectionGet = vi.fn()
  const mockCollectionDocSet = vi.fn().mockResolvedValue(undefined)
  const mockCollectionDocUpdate = vi.fn().mockResolvedValue(undefined)

  const mockFirestoreDoc = vi.fn((path: string) => ({
    get: () => mockDocGet(path),
    set: (data: unknown) => mockDocSet(path, data),
    update: (data: unknown) => mockDocUpdate(path, data),
  }))

  const mockFirestoreCollection = vi.fn((path: string) => ({
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: () => mockCollectionGet(path),
    doc: vi.fn(() => ({
      id: 'invite-123',
      set: (data: unknown) => mockCollectionDocSet(path, data),
      update: (data: unknown) => mockCollectionDocUpdate(path, data),
    })),
  }))

  return {
    mockDocGet,
    mockDocSet,
    mockDocUpdate,
    mockCollectionGet,
    mockCollectionDocSet,
    mockFirestoreDoc,
    mockFirestoreCollection,
  }
})

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUserByEmail: mockGetUserByEmail,
    getUser: mockGetUser,
    generateSignInWithEmailLink: mockGenerateSignInWithEmailLink,
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
    mockGenerateSignInWithEmailLink.mockResolvedValue('https://example.com/invite-link')
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

    expect(mockCollectionDocSet).toHaveBeenCalledWith(
      'users/user-2/notifications',
      expect.objectContaining({
        type: 'project_invitation_pending',
        projectId: 'org1/proj1',
        invitationId: 'invite-123',
      }),
    )
    expect(mockGenerateSignInWithEmailLink).toHaveBeenCalledWith(
      'existing@example.com',
      expect.objectContaining({
        url: expect.stringContaining('/accept-invite?'),
        handleCodeInApp: true,
      }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      existingUser: true,
      delivery: 'firebase_signin_link',
    }))
  })

  it('keeps pending invite successful when email-link delivery fails', async () => {
    const req = { body: {}, headers: { origin: 'https://app.example.com' } } as Request
    const res = makeRes() as Response

    mockGetUserByEmail.mockResolvedValue({ uid: 'user-2' })
    mockGenerateSignInWithEmailLink.mockRejectedValue(new Error('delivery failed'))
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

    expect(mockCollectionDocSet).toHaveBeenCalledWith(
      'users/user-2/notifications',
      expect.objectContaining({
        type: 'project_invitation_pending',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      existingUser: true,
      delivery: 'none',
    }))
  })

  it('generates Firebase sign-in link for new-user project invitations', async () => {
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

    expect(mockGenerateSignInWithEmailLink).toHaveBeenCalledWith(
      'new@example.com',
      expect.objectContaining({
        url: expect.stringContaining('/accept-invite?'),
        handleCodeInApp: true,
      }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', existingUser: false }))
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
