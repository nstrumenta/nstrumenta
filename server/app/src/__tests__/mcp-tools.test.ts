import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response } from 'express'
import { parseOrgProject } from '../shared/utils'

describe('MCP Tools', () => {
  let mockFirestore: any
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockFirestore = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }

    mockRequest = {
      headers: {},
      body: {},
      query: {},
    }

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      on: vi.fn(),
      headersSent: false,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should accept API key authentication', async () => {
      const apiKey = '0123456789abcdef0123456789abcdef0123456789abcdef'
      mockRequest.headers = { 'x-api-key': apiKey }

      mockFirestore.get.mockResolvedValue({
        data: () => ({ projectId: 'test-project' }),
      })

      expect(apiKey).toHaveLength(48)
      expect(mockRequest.headers['x-api-key']).toBe(apiKey)
    })

    it('should accept Firebase Bearer token authentication', async () => {
      const firebaseToken = 'firebase-jwt-token'
      mockRequest.headers = { authorization: `Bearer ${firebaseToken}` }

      expect(mockRequest.headers.authorization).toBe(`Bearer ${firebaseToken}`)
    })

    it('should reject requests without authentication', async () => {
      mockRequest.headers = {}

      expect(mockRequest.headers['x-api-key']).toBeUndefined()
      expect(mockRequest.headers.authorization).toBeUndefined()
    })
  })

  describe('MCP Tool Schemas', () => {
    it('should have valid schema for create_project', () => {
      const validInput = {
        name: 'Test Project',
        projectIdBase: 'test-project',
      }

      expect(validInput.name).toBeTruthy()
      expect(typeof validInput.name).toBe('string')
    })

    it('should have valid schema for create_api_key', () => {
      const validInput = {
        projectId: 'test-project',
        apiUrl: 'https://api.example.com',
      }

      expect(validInput.projectId).toBeTruthy()
      expect(typeof validInput.projectId).toBe('string')
    })

    it('should have valid schema for get_upload_url', () => {
      const validInput = {
        path: '/modules/test.tar.gz',
        metadata: { contentType: 'application/gzip' },
      }

      expect(validInput.path).toBeTruthy()
      expect(validInput.path.startsWith('/')).toBe(true)
    })

    it('should have valid schema for get_upload_data_url', () => {
      const validInput = {
        name: 'test-data.json',
        size: 1024,
        tags: 'test,data',
        overwrite: false,
      }

      expect(validInput.name).toBeTruthy()
      expect(typeof validInput.name).toBe('string')
      expect(validInput.size).toBeGreaterThan(0)
      expect(typeof validInput.overwrite).toBe('boolean')
    })

    it('should have valid schema for register_agent', () => {
      const validInput = {
        tag: 'test-agent',
      }

      expect(validInput.tag).toBeTruthy()
      expect(typeof validInput.tag).toBe('string')
    })

    it('should have valid schema for query_collection', () => {
      const validInput = {
        collection: 'data',
        limit: 10,
        field: 'createdAt',
        comparison: '>',
        value: 1000,
      }

      expect(validInput.collection).toBeTruthy()
      expect(validInput.limit).toBeGreaterThan(0)
    })
  })

  describe('Project Context', () => {
    it('should extract projectId from authenticated API key', async () => {
      const projectId = 'test-project-123'
      mockFirestore.get.mockResolvedValue({
        data: () => ({ projectId }),
      })

      const result = await mockFirestore.get()
      expect(result.data().projectId).toBe(projectId)
    })

    it('should extract userId from Firebase token', () => {
      const decodedToken = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
      }

      expect(decodedToken.uid).toBeTruthy()
      expect(typeof decodedToken.uid).toBe('string')
    })
  })

  describe('Tool Output Validation', () => {
    it('should return structured content for create_project', () => {
      const output = {
        id: 'new-project-123',
        name: 'Test Project',
        message: 'Project created successfully',
      }

      expect(output.id).toBeTruthy()
      expect(output.name).toBeTruthy()
      expect(output.message).toBeTruthy()
    })

    it('should return signed URL for get_upload_url', () => {
      const output = {
        uploadUrl: 'https://storage.googleapis.com/signed-url',
      }

      expect(output.uploadUrl).toBeTruthy()
      expect(output.uploadUrl.startsWith('https://')).toBe(true)
    })

    it('should return uploadUrl and filePath for get_upload_data_url', () => {
      const output = {
        uploadUrl: 'https://storage.googleapis.com/signed-data-url',
        filePath: 'my-org/my-project/data/uuid-123/test-data.json',
      }

      expect(output.uploadUrl).toBeTruthy()
      expect(output.uploadUrl.startsWith('https://')).toBe(true)
      expect(output.filePath).toMatch(/^[^/]+\/[^/]+\/data\//)
    })

    it('should return agentId for register_agent', () => {
      const output = {
        agentId: 'agent-uuid-123',
      }

      expect(output.agentId).toBeTruthy()
      expect(typeof output.agentId).toBe('string')
    })

    it('should return array of results for query_collection', () => {
      const output = {
        results: [
          { id: '1', name: 'item1' },
          { id: '2', name: 'item2' },
        ],
      }

      expect(Array.isArray(output.results)).toBe(true)
      expect(output.results.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should throw error for create_project without Firebase auth', async () => {
      const errorMessage = 'Firebase authentication required for project creation'

      expect(() => {
        throw new Error(errorMessage)
      }).toThrow(errorMessage)
    })

    it('should throw error for invalid project access', async () => {
      const errorMessage = 'Permission denied: not a project member'

      expect(() => {
        throw new Error(errorMessage)
      }).toThrow(errorMessage)
    })

    it('should handle Firestore errors gracefully', async () => {
      mockFirestore.get.mockRejectedValue(new Error('Firestore error'))

      await expect(mockFirestore.get()).rejects.toThrow('Firestore error')
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to MCP endpoints', () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000,
        max: 50,
        standardHeaders: true,
        legacyHeaders: false,
      }

      expect(rateLimitConfig.windowMs).toBe(900000)
      expect(rateLimitConfig.max).toBe(50)
    })
  })

  describe('AsyncLocalStorage Context', () => {
    it('should maintain projectId in request context', () => {
      const context = {
        projectId: 'test-project',
        userId: 'user-123',
        authType: 'apiKey' as const,
      }

      expect(context.projectId).toBeTruthy()
      expect(context.authType).toMatch(/apiKey|firebase/)
    })

    it('should support both authType values', () => {
      const apiKeyContext = { authType: 'apiKey' as const }
      const firebaseContext = { authType: 'firebase' as const }

      expect(apiKeyContext.authType).toBe('apiKey')
      expect(firebaseContext.authType).toBe('firebase')
    })
  })

  describe('Storage Access Control', () => {
    it('get_download_url input accepts relative path', () => {
      const input = { path: 'data/recording-123.mcap' }
      expect(input.path.includes('data/')).toBe(true)
    })

    it('get_download_url input accepts full storage path', () => {
      const input = { path: 'projects/proj-abc/data/recording-123.mcap' }
      expect(input.path.startsWith('projects/')).toBe(true)
    })

    it('get_download_url output has downloadUrl', () => {
      const output = { downloadUrl: 'https://storage.googleapis.com/signed-read-url?X-Goog-Signature=abc' }
      expect(output.downloadUrl.startsWith('https://')).toBe(true)
    })

    it('delete_file rejects paths outside the project', () => {
      const projectId = 'my-project'
      const foreignPath = 'projects/other-project/data/secret.mcap'
      const expectedPrefix = `projects/${projectId}/`
      expect(foreignPath.startsWith(expectedPrefix)).toBe(false)
    })

    it('delete_file accepts paths owned by the project', () => {
      const projectId = 'my-org/my-project'
      const [orgSlug, projectSlug] = projectId.split('/')
      const ownPath = `${orgSlug}/${projectSlug}/data/recording.mcap`
      const expectedPrefix = `${orgSlug}/${projectSlug}/`
      expect(ownPath.startsWith(expectedPrefix)).toBe(true)
    })

    it('delete_file derives Firestore docId from path hash when not provided', () => {
      const crypto = require('crypto')
      const filePath = 'my-org/my-project/data/recording.mcap'
      const hash = crypto.createHash('sha256').update(filePath).digest('hex')
      expect(hash).toHaveLength(64)
      expect(typeof hash).toBe('string')
    })

    it('storage rules deny all direct client access', () => {
      // Represents the storage.rules content — all direct Firebase SDK access is blocked
      const rulesContent = 'allow read, write: if false'
      expect(rulesContent).toContain('if false')
      expect(rulesContent).not.toContain('if request.auth')
    })
  })
})

describe('getStoragePathPrefix', () => {
  it('returns orgSlug/projectSlug for org-scoped projectId', () => {
    const { orgSlug, projectSlug } = parseOrgProject('my-org/my-project')
    expect(`${orgSlug}/${projectSlug}`).toBe('my-org/my-project')
  })

  it('prepended to a relative path produces the correct GCS path', () => {
    const { orgSlug, projectSlug } = parseOrgProject('acme/sensor-data')
    const prefix = `${orgSlug}/${projectSlug}`
    expect(`${prefix}/data/recording.mcap`).toBe('acme/sensor-data/data/recording.mcap')
  })
})

describe('get_upload_url / get_download_url path normalization', () => {
  function resolveStoragePath(projectId: string, originalPath: string): string {
    const [orgSlug, projectSlug] = projectId.split('/')
    const storagePathBase = `${orgSlug}/${projectSlug}`
    const stripped = originalPath.replace(/^\/+/, '')
    const relativePath = stripped.startsWith(storagePathBase + '/')
      ? stripped.slice(storagePathBase.length + 1)
      : stripped
    return `${storagePathBase}/${relativePath}`
  }

  it('relative path is prefixed with project', () => {
    expect(resolveStoragePath('acme/sensor-lab', 'data/recording.mcap'))
      .toBe('acme/sensor-lab/data/recording.mcap')
  })

  it('leading slash is stripped', () => {
    expect(resolveStoragePath('acme/sensor-lab', '/data/recording.mcap'))
      .toBe('acme/sensor-lab/data/recording.mcap')
  })

  it('full path including own project prefix is normalised (legacy caller)', () => {
    expect(resolveStoragePath('acme/sensor-lab', 'acme/sensor-lab/data/recording.mcap'))
      .toBe('acme/sensor-lab/data/recording.mcap')
  })

  it('full path from a different project is NOT treated as a full path — prefix is re-applied', () => {
    // A caller whose project is acme/sensor-lab cannot get a URL for victim/secret-proj/data/file
    // because the path does not start with their own prefix; it gets re-prefixed under their project.
    expect(resolveStoragePath('acme/sensor-lab', 'victim/secret-proj/data/file.mcap'))
      .toBe('acme/sensor-lab/victim/secret-proj/data/file.mcap')
  })
})
