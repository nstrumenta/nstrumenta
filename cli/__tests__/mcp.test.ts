import { describe, it, mock, before, after } from 'node:test';
import assert from 'node:assert';
import { McpClient } from '../mcp.ts';

describe('McpClient', () => {
  let originalFetch: typeof fetch;

  before(() => {
    originalFetch = global.fetch;
  });

  after(() => {
    global.fetch = originalFetch;
  });

  describe('callTool method', () => {
    it('should handle structured content responses', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { data: 'structured' }
          }
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.listData();

      assert.ok(result);
    });

    it('should handle text content responses', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"key": "value"}' }]
          }
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.setAgentAction('agent-1', '{}');

      assert.ok(result);
    });

    it('should throw on HTTP errors', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await assert.rejects(
        async () => await client.listData(),
        /MCP request failed: 500/
      );
    });

    it('should throw on JSON-RPC errors', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          error: { message: 'Tool not found' }
        })
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await assert.rejects(
        async () => await client.listData(),
        /MCP error: Tool not found/
      );
    });

    it('should throw on tool errors', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            isError: true,
            content: [{ text: 'Tool execution failed' }]
          }
        })
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await assert.rejects(
        async () => await client.listData(),
        /Tool error: Tool execution failed/
      );
    });
  });

  describe('runModule', () => {
    it('should call run_module tool with correct parameters', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"actionId": "action-123"}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.runModule('agent-1', 'my-module', { 
        version: '1.0.0', 
        args: ['--arg1', 'value1'] 
      });

      assert.strictEqual(result.actionId, 'action-123');
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'run_module');
      assert.deepStrictEqual(body.params.arguments, {
        agentId: 'agent-1',
        moduleName: 'my-module',
        moduleVersion: '1.0.0',
        args: ['--arg1', 'value1']
      });
    });
  });

  describe('listModules', () => {
    it('should call list_modules tool with filter', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { modules: [{ name: 'test-module' }] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.listModules('test');

      assert.strictEqual(result.modules.length, 1);
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'list_modules');
      assert.deepStrictEqual(body.params.arguments, { filter: 'test' });
    });

    it('should call list_modules without filter', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { modules: [] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.listModules();

      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      // JSON.stringify removes undefined values, so we get empty object
      assert.deepStrictEqual(body.params.arguments, {});
    });
  });

  describe('listAgents', () => {
    it('should call list_agents tool', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { agents: [['agent-1', { tag: 'dev' }]] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.listAgents();

      assert.strictEqual(result.agents.length, 1);
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'list_agents');
    });
  });

  describe('hostModule', () => {
    it('should call host_module tool', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"actionId": "action-456"}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.hostModule('my-module', { version: '2.0.0' });

      assert.strictEqual(result.actionId, 'action-456');
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'host_module');
      assert.strictEqual(body.params.arguments.moduleName, 'my-module');
      assert.strictEqual(body.params.arguments.moduleVersion, '2.0.0');
    });
  });

  describe('cloudRun', () => {
    it('should call cloud_run tool with all options', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"actionId": "action-789"}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.cloudRun('my-module', { 
        version: '1.0.0', 
        args: ['--batch'],
        image: 'custom-image'
      });

      assert.strictEqual(result.actionId, 'action-789');
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'cloud_run');
      assert.strictEqual(body.params.arguments.image, 'custom-image');
    });
  });

  describe('setAgentAction', () => {
    it('should call set_agent_action tool', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"actionId": "action-123"}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.setAgentAction('agent-1', '{"foo":"bar"}');

      assert.deepStrictEqual(result, { actionId: 'action-123' });
      
      const call = (mockFetch as any).mock.calls[0];
      // serverUrl is empty in tests without env vars
      assert.strictEqual(call.arguments[0], '/');
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.method, 'tools/call');
      assert.strictEqual(body.params.name, 'set_agent_action');
      assert.deepStrictEqual(body.params.arguments, {
        agentId: 'agent-1',
        action: '{"foo":"bar"}',
      });
    });
  });

  describe('cleanAgentActions', () => {
    it('should call clean_agent_actions tool', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"success": true}' }],
          },
        }),
      } as Response));
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
  });

  describe('listData', () => {
    it('should call list_data tool with default type', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { objects: [{ id: 'data-1' }] },
          },
        }),
      } as Response));
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

    it('should call list_data tool with custom type', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { objects: [] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.listData('modules');

      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.deepStrictEqual(body.params.arguments, { type: 'modules' });
    });
  });

  describe('getAgentActions', () => {
    it('should call get_agent_actions with default status', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { actions: [{ id: 'action-1', status: 'pending' }] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.getAgentActions('agent-1');

      assert.strictEqual(result.actions.length, 1);
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'get_agent_actions');
      assert.deepStrictEqual(body.params.arguments, {
        agentId: 'agent-1',
        status: 'pending'
      });
    });

    it('should call get_agent_actions with custom status', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { actions: [] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.getAgentActions('agent-1', 'completed');

      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.deepStrictEqual(body.params.arguments, {
        agentId: 'agent-1',
        status: 'completed'
      });
    });
  });

  describe('updateAgentAction', () => {
    it('should call update_agent_action without error', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"success": true}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      const result = await client.updateAgentAction('agent-1', 'action-1', 'completed');

      assert.strictEqual(result.success, true);
      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.name, 'update_agent_action');
      // JSON.stringify removes undefined error field
      assert.deepStrictEqual(body.params.arguments, {
        agentId: 'agent-1',
        actionId: 'action-1',
        status: 'completed'
      });
    });

    it('should call update_agent_action with error message', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            content: [{ text: '{"success": true}' }],
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.updateAgentAction('agent-1', 'action-1', 'error', 'Failed to execute');

      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.params.arguments.error, 'Failed to execute');
    });
  });

  describe('request headers', () => {
    it('should include correct headers', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { agents: [] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.listAgents();

      const call = (mockFetch as any).mock.calls[0];
      const headers = call.arguments[1].headers;
      assert.strictEqual(headers['Content-Type'], 'application/json');
      assert.strictEqual(headers['Accept'], 'application/json, text/event-stream');
      // x-api-key is empty string when no env var is set (test environment)
      assert.strictEqual(headers['x-api-key'], '');
    });
  });

  describe('JSON-RPC protocol', () => {
    it('should send valid JSON-RPC 2.0 request', async () => {
      const mockFetch = mock.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            structuredContent: { modules: [] },
          },
        }),
      } as Response));
      global.fetch = mockFetch as any;

      const client = new McpClient();
      await client.listModules();

      const call = (mockFetch as any).mock.calls[0];
      const body = JSON.parse(call.arguments[1].body as string);
      assert.strictEqual(body.jsonrpc, '2.0');
      assert.strictEqual(body.method, 'tools/call');
      assert.ok(body.id);
      assert.ok(body.params);
      assert.ok(body.params.name);
      assert.ok(body.params.arguments);
    });
  });
});
