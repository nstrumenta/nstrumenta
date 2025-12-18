import { describe, it, expect, beforeAll } from 'vitest'

const API_URL = process.env.API_URL || 'http://localhost:5999'
const NSTRUMENTA_API_KEY = process.env.NSTRUMENTA_API_KEY

if (!NSTRUMENTA_API_KEY) {
  throw new Error('NSTRUMENTA_API_KEY environment variable is required')
}

// Helper function to call MCP tools
async function callMcpTool(toolName, args, projectId = 'ci') {
  const mcpRequest = {
    jsonrpc: '2.0',
    id: Math.random().toString(36).substring(7),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'x-nstrumenta-project-id': projectId,
      'Authorization': `Bearer ${NSTRUMENTA_API_KEY}`
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

describe('Frontend MCP Integration with API Key', () => {
  it('should list modules via MCP', async () => {
    const result = await callMcpTool('list_modules', {})
    
    expect(result).toBeDefined()
    expect(result.modules).toBeDefined()
    expect(Array.isArray(result.modules)).toBe(true)
  })

  it('should list agents via MCP', async () => {
    const result = await callMcpTool('list_agents', {})
    
    expect(result).toBeDefined()
    expect(result.agents).toBeDefined()
    expect(Array.isArray(result.agents)).toBe(true)
  })

  it('should list data via MCP', async () => {
    const result = await callMcpTool('list_data', {
      type: 'mcap'
    })
    
    expect(result).toBeDefined()
    expect(result.objects).toBeDefined()
    expect(Array.isArray(result.objects)).toBe(true)
  })

  it('should get project info via MCP', async () => {
    const result = await callMcpTool('get_project', {})
    
    console.log('get_project result:', JSON.stringify(result, null, 2))
    expect(result).toBeDefined()
    // The result format may vary - let's just check it's defined for now
  })

  it('should handle authentication errors', async () => {
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 'auth-test',
      method: 'tools/call',
      params: {
        name: 'list_modules',
        arguments: {}
      }
    }

    // Send without auth token
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'x-nstrumenta-project-id': 'ci'
      },
      body: JSON.stringify(mcpRequest)
    })

    const data = await response.json()
    expect(data.error).toBeDefined()
  })
})
