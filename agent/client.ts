// Extract base URL from API key by decoding base64 portion
const getServerUrl = (apiKey: string): string => {
  const urlOverride = process.env.NSTRUMENTA_API_URL || process.env.NST_API_URL;
  return urlOverride || Buffer.from(apiKey.split(':')[1] || '', 'base64').toString().trim();
};

export type ModuleRunner = (
  moduleName: string,
  options: { moduleVersion?: string; commandArgs?: string[] }
) => Promise<void>;

export interface AgentClientOptions {
  apiKey: string;
  tag?: string;
  debug?: boolean;
  moduleRunner?: ModuleRunner;
}

export class AgentClient {
  private apiKey: string;
  private tag?: string;
  private debug: boolean;
  private agentId?: string;
  private moduleRunner?: ModuleRunner;

  private serverUrl: string;

  constructor(options: AgentClientOptions) {
    this.apiKey = options.apiKey;
    this.serverUrl = getServerUrl(options.apiKey);
    this.tag = options.tag;
    this.debug = options.debug || false;
    this.moduleRunner = options.moduleRunner;
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
      console.log(`${this.serverUrl}/registerAgent`, data);
      const response = await fetch(`${this.serverUrl}/registerAgent`, {
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
      const sseUrl = `${this.serverUrl}/mcp/sse`;
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
      const response = await fetch(`${this.serverUrl}/mcp/messages?sessionId=${sessionId}`, {
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
      const response = await fetch(`${this.serverUrl}/`, {
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
            if (this.moduleRunner) {
              await this.moduleRunner(moduleName, { moduleVersion: version, commandArgs: args });
              await this.updateActionStatus(actionId, 'complete');
            } else {
              await this.updateActionStatus(actionId, 'error', 'No module runner configured');
              console.error('AgentClient: moduleRunner not configured, cannot run modules');
            }
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
      const response = await fetch(`${this.serverUrl}/`, {
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
