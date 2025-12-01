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

// Mock dependencies
vi.mock('../authentication', () => ({
  auth: vi.fn(),
  withAuth: vi.fn((fn) => fn)
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

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: class {
      registerTool = registerToolMock
      connect = connectMock
      resource = resourceMock
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
import { createAgentAction } from '../api/setAgentAction'
import { cancelAgentActions } from '../api/closePendingAgentActions'
import { getDataList } from '../api/listStorageObjects'

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
    // vi.clearAllMocks() // Don't clear all mocks as it clears registerToolMock
    // registerToolMock.mockClear() // Don't clear this as it's called at module load time
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

  it('should register set_agent_action tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'set_agent_action')
    expect(tool).toBeDefined()
    expect(tool[1].description).toContain('Sets a generic action')
  })

  it('should register clean_agent_actions tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'clean_agent_actions')
    expect(tool).toBeDefined()
    expect(tool[1].description).toContain('Cancels all pending actions')
  })

  it('should register list_data tool', () => {
    const calls = registerToolMock.mock.calls
    const tool = calls.find((call: any) => call[0] === 'list_data')
    expect(tool).toBeDefined()
    expect(tool[1].description).toContain('Lists data objects')
  })
})

