import { endpoints } from '../cli/utils';
import { Run } from '../cli/commands/module';

export interface AgentClientOptions {
  apiKey: string;
  tag?: string;
  debug?: boolean;
}

export class AgentClient {
  private apiKey: string;
  private tag?: string;
  private debug: boolean;
  private agentId?: string;

  constructor(options: AgentClientOptions) {
    this.apiKey = options.apiKey;
    this.tag = options.tag;
    this.debug = options.debug || false;
  }

  public async connect() {
    await this.registerAgent();
    if (this.agentId) {
      await this.startActionPolling();
    }
  }

  public getAgentId(): string | undefined {
    return this.agentId;
  }

  private async registerAgent() {
    if (!this.tag) {
      console.warn('Cannot register agent: no tag provided');
      return;
    }

    try {
      const data = { tag: this.tag };
      console.log(endpoints.REGISTER_AGENT, data);
      const response = await fetch(endpoints.REGISTER_AGENT, {
        method: 'post',
        headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const { agentId, actionsCollectionPath } = (await response.json()) as {
        agentId: string;
        actionsCollectionPath: string;
      };
      this.agentId = agentId;
      console.log(`Registered as agent ${agentId}`);
    } catch (err) {
      console.error('Failed to register agent:', (err as Error).message);
      throw err;
    }
  }

  private async startActionPolling() {
    if (!this.agentId) {
      console.warn('Cannot start action polling: agentId not set');
      return;
    }

    console.log(`Starting SSE connection for agent ${this.agentId}`);

    try {
      // Connect to SSE endpoint
      const baseUrl = endpoints.MCP.replace(/\/$/, '');
      const sseUrl = `${baseUrl}/mcp/sse`;
      const response = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          Accept: 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      console.log(`SSE connected for agent ${this.agentId}`);

      // Get session ID from response
      let sessionId: string | null = null;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Subscribe to agent actions resource
      const projectId = this.apiKey.split(':')[0];
      const resourceUri = `projects://${projectId}/agents/${this.agentId}/actions`;

      // Process SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Extract session ID from endpoint message
              if (data.method === 'endpoint' && data.params?.endpoint) {
                sessionId = new URL(data.params.endpoint).searchParams.get('sessionId');
                if (sessionId && this.debug) {
                  console.log(`SSE session ID: ${sessionId}`);
                }

                // Subscribe to resource updates
                await this.subscribeToResource(sessionId, resourceUri);
              }

              // Handle resource updates
              if (data.method === 'notifications/resources/updated') {
                const updatedUri = data.params?.uri;
                if (updatedUri === resourceUri) {
                  if (this.debug) {
                    console.log('Agent actions updated, fetching...');
                  }
                  await this.fetchAndProcessActions();
                }
              }
            } catch (err) {
              if (this.debug) {
                console.error('Error parsing SSE data:', err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('SSE connection error:', (err as Error).message);
      // Fall back to periodic check every 30 seconds on error
      console.log('Falling back to periodic polling every 30s');
      setInterval(async () => {
        try {
          await this.fetchAndProcessActions();
        } catch (err) {
          console.error('Error in fallback polling:', (err as Error).message);
        }
      }, 30000);
    }
  }

  private async subscribeToResource(sessionId: string | null, resourceUri: string) {
    if (!sessionId) return;

    try {
      const baseUrl = endpoints.MCP.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/mcp/messages?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'resources/subscribe',
          params: { uri: resourceUri },
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(`Failed to subscribe to resource: ${response.status}`);
      }
    } catch (err) {
      console.error('Error subscribing to resource:', (err as Error).message);
    }
  }

  private async fetchAndProcessActions() {
    if (!this.agentId) return;

    try {
      const response = await fetch(endpoints.MCP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_agent_actions',
            arguments: { agentId: this.agentId, status: 'pending' },
          },
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(`Failed to fetch actions: ${response.status}`);
        return;
      }

      const result = (await response.json()) as any;
      const actions = result.result?.structuredContent?.actions || [];

      for (const action of actions) {
        if (this.debug) {
          console.log('Processing action:', action);
        }

        const { actionId, task, data } = action;

        if (task === 'runModule') {
          if (!data || !data.module) {
            console.log('Aborting: runModule command needs to specify data.module');
            continue;
          }

          const { module: moduleName, args, version } = data;
          console.log('running module', moduleName, version);

          // Update status to started
          await this.updateActionStatus(actionId, 'started');

          // Run the module
          try {
            await Run(moduleName, { moduleVersion: version, commandArgs: args });
            await this.updateActionStatus(actionId, 'complete');
          } catch (err) {
            await this.updateActionStatus(actionId, 'error', (err as Error).message);
          }
        } else {
          if (this.debug) {
            console.log('Unknown task:', task);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching/processing actions:', (err as Error).message);
    }
  }

  private async updateActionStatus(actionId: string, status: string, error?: string) {
    if (!this.agentId) return;

    try {
      const response = await fetch(endpoints.MCP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'update_agent_action',
            arguments: {
              agentId: this.agentId,
              actionId,
              status,
              ...(error && { error }),
            },
          },
          id: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(`Failed to update action status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error updating action status:', (err as Error).message);
    }
  }
}
