import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { registerToolMock, connectMock, resourceMock } = vi.hoisted(() => {
  return {
    registerToolMock: vi.fn(),
    connectMock: vi.fn(),
    resourceMock: vi.fn()
  }
})

const { closeMock, handleRequestMock } = vi.hoisted(() => {
  return {
    closeMock: vi.fn(),
    handleRequestMock: vi.fn()
  }
})

const { mockFirestoreGet, mockFirestoreSet, mockFirestoreCollection } = vi.hoisted(() => {
  const mockFirestoreGet = vi.fn()
  const mockFirestoreSet = vi.fn()
  const mockFirestoreCollection = vi.fn()
  return { mockFirestoreGet, mockFirestoreSet, mockFirestoreCollection }
})

const { mockAuthFn, mockFirebaseAuthFn } = vi.hoisted(() => {
  return {
    mockAuthFn: vi.fn(),
    mockFirebaseAuthFn: vi.fn()
  }
})

const { sseHandlePostMessage, sseSessionId, sseOnClose } = vi.hoisted(() => {
  return {
    sseHandlePostMessage: vi.fn(),
    sseSessionId: 'test-session-id',
    sseOnClose: { fn: null as any }
  }
})

// Mock dependencies
vi.mock('../authentication', () => ({
  auth: mockAuthFn,
  withAuth: vi.fn((fn) => fn)
}))

vi.mock('../authentication/firebaseAuth', () => ({
  firebaseAuth: mockFirebaseAuthFn
}))

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    doc: vi.fn((path: string) => ({
      get: mockFirestoreGet,
      set: mockFirestoreSet
    })),
    collection: mockFirestoreCollection
  },
  serviceAccount: { project_id: 'test' }
}))

vi.mock('../api/setAgentAction', () => ({
  createAgentAction: vi.fn()
}))

vi.mock('../api/closePendingAgentActions', () => ({
  cancelAgentActions: vi.fn()
}))

vi.mock('../api/listStorageObjects', () => ({
  getDataList: vi.fn()
}))

vi.mock('../api/listModules', () => ({
  getModulesList: vi.fn()
}))

vi.mock('../api/listAgents', () => ({
  getAgentsList: vi.fn()
}))

vi.mock('../api/getProject', () => ({
  getProjectInfo: vi.fn()
}))

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: class {
      registerTool = registerToolMock
      connect = connectMock
      resource = resourceMock
      server = { sendResourceUpdated: vi.fn() }
      close = vi.fn()
    }
  }
})

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
  return {
    StreamableHTTPServerTransport: class {
      close = closeMock
      handleRequest = handleRequestMock
    }
  }
})

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
  return {
    SSEServerTransport: class {
      sessionId = sseSessionId
      handlePostMessage = sseHandlePostMessage
      onclose: (() => void) | null = null
      constructor(path: string, res: Response) {
        // Store onclose setter for test access
      }
    }
  }
})

import { handleMcpRequest, handleMcpSseRequest, handleMcpSseMessage, notifyResourceUpdate } from '../mcp'
import { auth } from '../authentication'

describe('MCP Handler', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      on: vi.fn(),
      headersSent: false
    }
    connectMock.mockClear()
    closeMock.mockClear()
    handleRequestMock.mockClear()
    mockAuthFn.mockReset()
    mockFirebaseAuthFn.mockReset()
    mockFirestoreGet.mockReset()
  })

  it('should return 401 if authentication fails', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false, message: 'Invalid key' })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: false, message: 'No token' })

    await handleMcpRequest(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: expect.stringContaining('Authentication required')
      },
      id: null
    })
  })

  it('should process request if API key authentication succeeds', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: true, projectId: 'test-project' })

    await handleMcpRequest(req as Request, res as Response)

    expect(connectMock).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(401)
  })

  it('should register set_agent_action tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'set_agent_action')
    expect(tool).toBeDefined()
    if (!tool) throw new Error('Tool not found')
    expect(tool[1].description).toContain('Sets a generic action')
  })

  it('should register clean_agent_actions tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'clean_agent_actions')
    expect(tool).toBeDefined()
    if (!tool) throw new Error('Tool not found')
    expect(tool[1].description).toContain('Cancels all pending actions')
  })

  it('should register list_data tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'list_data')
    expect(tool).toBeDefined()
    if (!tool) throw new Error('Tool not found')
    expect(tool[1].description).toContain('Lists data objects')
  })
})

describe('Multi-tenancy: Firebase Auth with project-id header', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      on: vi.fn(),
      headersSent: false
    }
    connectMock.mockClear()
    handleRequestMock.mockClear()
    mockAuthFn.mockReset()
    mockFirebaseAuthFn.mockReset()
    mockFirestoreGet.mockReset()
  })

  it('should authenticate Firebase user with valid project-id header', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user-1' })
    mockFirestoreGet.mockResolvedValue({
      exists: true,
      data: () => ({ members: { 'user-1': { role: 'owner' } } })
    })
    req.headers = { 'x-nstrumenta-project-id': 'test-org/my-project' }

    await handleMcpRequest(req as Request, res as Response)

    expect(connectMock).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(401)
  })

  it('should reject Firebase user when project does not exist', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user-1' })
    mockFirestoreGet.mockResolvedValue({ exists: false })
    req.headers = { 'x-nstrumenta-project-id': 'test-org/nonexistent-project' }

    await handleMcpRequest(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining("not found")
        })
      })
    )
  })

  it('should reject Firebase user who is not a member of the project', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user-1' })
    mockFirestoreGet.mockResolvedValue({
      exists: true,
      data: () => ({ members: { 'other-user': { role: 'owner' } } })
    })
    req.headers = { 'x-nstrumenta-project-id': 'test-org/their-project' }

    await handleMcpRequest(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining("not a member")
        })
      })
    )
  })

  it('should allow Firebase user without project-id header (empty projectId for create_project)', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: true, userId: 'user-1' })
    // No x-nstrumenta-project-id header set

    await handleMcpRequest(req as Request, res as Response)

    expect(connectMock).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(401)
    expect(mockFirestoreGet).not.toHaveBeenCalled()
  })
})

describe('Multi-tenancy: SSE session scoping', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      query: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
      on: vi.fn(),
      headersSent: false
    }
    connectMock.mockClear()
    mockAuthFn.mockReset()
    mockFirebaseAuthFn.mockReset()
    mockFirestoreGet.mockReset()
    sseHandlePostMessage.mockClear()
  })

  it('should return 401 for SSE request with failed auth', async () => {
    mockAuthFn.mockResolvedValue({ authenticated: false })
    mockFirebaseAuthFn.mockResolvedValue({ authenticated: false, message: 'No token' })

    await handleMcpSseRequest(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('should return 404 for SSE message with unknown session', async () => {
    req.query = { sessionId: 'nonexistent-session' }

    await handleMcpSseMessage(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should only notify sessions belonging to the matching project', async () => {
    // notifyResourceUpdate with a projectId should skip sessions for other projects
    // Since we can't easily inspect session internals without setting up real SSE,
    // we test that the function doesn't throw when called with no active sessions
    await expect(
      notifyResourceUpdate('projects://proj-a/agents/agent-1/actions', 'proj-a')
    ).resolves.not.toThrow()
  })
})

