import { describe, it, mock, before, after } from 'node:test';
import assert from 'node:assert';
import { McpClient } from '../mcp';

describe('McpClient', () => {
  let originalFetch: typeof fetch;

  before(() => {
    originalFetch = global.fetch;
  });

  after(() => {
    global.fetch = originalFetch;
  });

  it('should call set_agent_action tool', async () => {
    const mockFetch = mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"actionId": "action-123"}' }],
          },
        }),
      } as Response;
    });
    global.fetch = mockFetch as any;

    const client = new McpClient();
    const result = await client.setAgentAction('agent-1', '{"foo":"bar"}');

    assert.deepStrictEqual(result, { actionId: 'action-123' });
    
    const call = (mockFetch as any).mock.calls[0];
    assert.strictEqual(call.arguments[0], 'http://localhost:8080/');
    const body = JSON.parse(call.arguments[1].body as string);
    assert.strictEqual(body.method, 'tools/call');
    assert.strictEqual(body.params.name, 'set_agent_action');
    assert.deepStrictEqual(body.params.arguments, {
      agentId: 'agent-1',
      action: '{"foo":"bar"}',
    });
  });

  it('should call clean_agent_actions tool', async () => {
    const mockFetch = mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"success": true}' }],
          },
        }),
      } as Response;
    });
    global.fetch = mockFetch as any;

    const client = new McpClient();
    const result = await client.cleanAgentActions('agent-1');

    assert.deepStrictEqual(result, { success: true });
    
    const call = (mockFetch as any).mock.calls[0];
    const body = JSON.parse(call.arguments[1].body as string);
    assert.strictEqual(body.params.name, 'clean_agent_actions');
    assert.deepStrictEqual(body.params.arguments, {
      agentId: 'agent-1',
    });
  });

  it('should call list_data tool', async () => {
    const mockFetch = mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { objects: [{ id: 'data-1' }] },
          },
        }),
      } as Response;
    });
    global.fetch = mockFetch as any;

    const client = new McpClient();
    const result = await client.listData();

    assert.deepStrictEqual(result, { objects: [{ id: 'data-1' }] });
    
    const call = (mockFetch as any).mock.calls[0];
    const body = JSON.parse(call.arguments[1].body as string);
    assert.strictEqual(body.params.name, 'list_data');
    assert.deepStrictEqual(body.params.arguments, {
      type: 'data',
    });
  });
});
