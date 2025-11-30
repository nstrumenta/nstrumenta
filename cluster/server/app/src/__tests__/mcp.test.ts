import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

const { registerToolMock, connectMock } = vi.hoisted(() => {
  return {
    registerToolMock: vi.fn(),
    connectMock: vi.fn()
  }
})

const { closeMock, handleRequestMock } = vi.hoisted(() => {
  return {
    closeMock: vi.fn(),
    handleRequestMock: vi.fn()
  }
})

// Mock dependencies
vi.mock('../authentication', () => ({
  auth: vi.fn(),
  withAuth: vi.fn((fn) => fn)
}))

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: class {
      registerTool = registerToolMock
      connect = connectMock
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

import { handleMcpRequest } from '../mcp'
import { auth } from '../authentication'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

describe('MCP Handler', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: any

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
    next = vi.fn()
    vi.clearAllMocks()
    registerToolMock.mockClear()
    connectMock.mockClear()
    closeMock.mockClear()
    handleRequestMock.mockClear()
  })

  it('should return 401 if authentication fails', async () => {
    (auth as any).mockResolvedValue({ authenticated: false, message: 'Invalid key' })

    await handleMcpRequest(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        message: 'Invalid key'
      })
    }))
  })

  it('should process request if authentication succeeds', async () => {
    (auth as any).mockResolvedValue({ authenticated: true, projectId: 'test-project' })
    
    await handleMcpRequest(req as Request, res as Response)

    expect(connectMock).toHaveBeenCalled()
    expect(auth).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(401)
  })
})

