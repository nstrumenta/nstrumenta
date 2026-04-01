import { describe, it, expect, vi, beforeEach } from 'vitest'

const API_URL = 'http://localhost:5999'

async function callMcpTool(toolName, args, apiKey, projectId = 'ci') {
  const mcpRequest = {
    jsonrpc: '2.0',
    id: Math.random().toString(36).substring(7),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  }

  const response = await fetch(`${API_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'x-nstrumenta-project-id': projectId,
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(mcpRequest)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  return data.result?.structuredContent || data.result
}

describe('callMcpTool', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends a well-formed JSON-RPC request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { modules: [] } })
    })
    vi.stubGlobal('fetch', mockFetch)

    await callMcpTool('list_modules', {}, 'test-key', 'my-project')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(`${API_URL}/mcp`)
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe('Bearer test-key')
    expect(options.headers['x-nstrumenta-project-id']).toBe('my-project')

    const body = JSON.parse(options.body)
    expect(body.jsonrpc).toBe('2.0')
    expect(body.method).toBe('tools/call')
    expect(body.params.name).toBe('list_modules')
    expect(body.params.arguments).toEqual({})
  })

  it('returns structuredContent when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { structuredContent: { modules: ['a', 'b'] } } })
    }))

    const result = await callMcpTool('list_modules', {}, 'key')
    expect(result).toEqual({ modules: ['a', 'b'] })
  })

  it('falls back to result when structuredContent is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { agents: [] } })
    }))

    const result = await callMcpTool('list_agents', {}, 'key')
    expect(result).toEqual({ agents: [] })
  })

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized')
    }))

    await expect(callMcpTool('list_modules', {}, 'bad-key')).rejects.toThrow('HTTP 401: Unauthorized')
  })

  it('throws on JSON-RPC error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: { message: 'Tool not found' } })
    }))

    await expect(callMcpTool('unknown_tool', {}, 'key')).rejects.toThrow('Tool not found')
  })
})

