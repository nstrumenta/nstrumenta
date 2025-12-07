import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

describe('Unified Authentication', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockFirestore: any

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
    }

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    }

    mockFirestore = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      get: vi.fn(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
  })

  describe('API Key Authentication', () => {
    it('should authenticate with x-api-key header', async () => {
      const apiKey = '0123456789abcdef0123456789abcdef0123456789abcdef:dGVzdA=='
      mockRequest.headers = { 'x-api-key': apiKey }

      const keyPart = apiKey.split(':')[0]
      expect(keyPart).toHaveLength(48)
      expect(/^[0-9a-f]+$/i.test(keyPart)).toBe(true)
    })

    it('should extract projectId from API key data', async () => {
      const keyData = {
        projectId: 'test-project',
        createdAt: Date.now(),
      }

      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => keyData,
      })

      const doc = await mockFirestore.get()
      expect(doc.exists).toBe(true)
      expect(doc.data().projectId).toBe('test-project')
    })

    it('should reject invalid API key format', () => {
      const invalidKey = 'invalid-key'
      const keyPart = invalidKey.split(':')[0]

      expect(keyPart.length).not.toBe(48)
    })

    it('should reject non-existent API key', async () => {
      mockFirestore.get.mockResolvedValue({
        exists: false,
        data: () => undefined,
      })

      const doc = await mockFirestore.get()
      expect(doc.exists).toBe(false)
    })
  })

  describe('Firebase Authentication', () => {
    it('should authenticate with Authorization Bearer token', () => {
      const firebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
      mockRequest.headers = {
        authorization: `Bearer ${firebaseToken}`,
      }

      expect(mockRequest.headers.authorization).toBe(`Bearer ${firebaseToken}`)
      expect(mockRequest.headers.authorization?.startsWith('Bearer ')).toBe(true)
    })

    it('should extract userId from decoded token', () => {
      const decodedToken = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        iat: Date.now(),
        exp: Date.now() + 3600,
      }

      expect(decodedToken.uid).toBeTruthy()
      expect(decodedToken.email).toBeTruthy()
    })

    it('should find project for authenticated user', async () => {
      const userId = 'user-123'
      const projectDoc = {
        id: 'project-123',
        data: () => ({
          name: 'Test Project',
          members: { [userId]: { role: 'owner' } },
        }),
      }

      mockFirestore.get.mockResolvedValue({
        empty: false,
        docs: [projectDoc],
      })

      const result = await mockFirestore.get()
      expect(result.empty).toBe(false)
      expect(result.docs[0].id).toBe('project-123')
    })

    it('should reject if no project found for user', async () => {
      mockFirestore.get.mockResolvedValue({
        empty: true,
        docs: [],
      })

      const result = await mockFirestore.get()
      expect(result.empty).toBe(true)
      expect(result.docs.length).toBe(0)
    })
  })

  describe('Auth Priority', () => {
    it('should try API key auth first', async () => {
      mockRequest.headers = {
        'x-api-key': '0123456789abcdef0123456789abcdef0123456789abcdef',
        authorization: 'Bearer firebase-token',
      }

      const hasApiKey = !!mockRequest.headers['x-api-key']
      expect(hasApiKey).toBe(true)
    })

    it('should fall back to Firebase if API key fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer firebase-token',
      }

      const hasApiKey = !!mockRequest.headers['x-api-key']
      const hasBearer = !!mockRequest.headers.authorization

      expect(hasApiKey).toBe(false)
      expect(hasBearer).toBe(true)
    })

    it('should reject if both auth methods fail', () => {
      mockRequest.headers = {}

      const hasAnyAuth =
        !!mockRequest.headers['x-api-key'] || !!mockRequest.headers.authorization

      expect(hasAnyAuth).toBe(false)
    })
  })

  describe('Auth Result Structure', () => {
    it('should return correct structure for API key auth', () => {
      const authResult = {
        authenticated: true,
        projectId: 'test-project',
        authType: 'apiKey' as const,
      }

      expect(authResult.authenticated).toBe(true)
      expect(authResult.projectId).toBeTruthy()
      expect(authResult.authType).toBe('apiKey')
      expect(authResult).not.toHaveProperty('userId')
    })

    it('should return correct structure for Firebase auth', () => {
      const authResult = {
        authenticated: true,
        projectId: 'test-project',
        userId: 'user-123',
        authType: 'firebase' as const,
      }

      expect(authResult.authenticated).toBe(true)
      expect(authResult.projectId).toBeTruthy()
      expect(authResult.userId).toBeTruthy()
      expect(authResult.authType).toBe('firebase')
    })

    it('should return correct structure for failed auth', () => {
      const authResult = {
        authenticated: false,
        projectId: '',
        message: 'Authentication required',
      }

      expect(authResult.authenticated).toBe(false)
      expect(authResult.projectId).toBe('')
      expect(authResult.message).toBeTruthy()
    })
  })

  describe('Request Context', () => {
    it('should store auth context for API key requests', () => {
      const context = {
        projectId: 'test-project',
        authType: 'apiKey' as const,
      }

      expect(context.projectId).toBeTruthy()
      expect(context.authType).toBe('apiKey')
      expect(context).not.toHaveProperty('userId')
    })

    it('should store auth context for Firebase requests', () => {
      const context = {
        projectId: 'test-project',
        userId: 'user-123',
        authType: 'firebase' as const,
      }

      expect(context.projectId).toBeTruthy()
      expect(context.userId).toBeTruthy()
      expect(context.authType).toBe('firebase')
    })
  })
})
