import { resolveApiKey, resolveApiUrl } from './utils';

export class McpClient {
  private apiKey: string;
  private serverUrl: string;

  constructor() {
    this.apiKey = resolveApiKey();
    this.serverUrl = resolveApiUrl();
  }

  private async callTool<T>(toolName: string, args: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.serverUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
        id: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as any;

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message || 'Unknown error'}`);
    }

    const toolResult = result.result;
    if (toolResult.isError) {
      throw new Error(`Tool error: ${toolResult.content?.[0]?.text || 'Unknown error'}`);
    }

    // Return structured content if available, otherwise parse text content
    if (toolResult.structuredContent) {
      return toolResult.structuredContent as T;
    }

    return toolResult.content?.[0]?.text
      ? JSON.parse(toolResult.content[0].text)
      : (toolResult as T);
  }

  async runModule(
    agentId: string,
    moduleName: string,
    options: { version?: string; args?: string[] } = {}
  ): Promise<{ actionId: string }> {
    return this.callTool('run_module', {
      agentId,
      moduleName,
      moduleVersion: options.version,
      args: options.args,
    });
  }

  async listModules(filter?: string): Promise<{ modules: any[] }> {
    return this.callTool('list_modules', { filter });
  }

  async listAgents(): Promise<{ agents: [string, any][] }> {
    return this.callTool('list_agents', {});
  }

  async hostModule(
    moduleName: string,
    options: { version?: string; args?: string[] } = {}
  ): Promise<{ actionId: string }> {
    return this.callTool('host_module', {
      moduleName,
      moduleVersion: options.version,
      args: options.args,
    });
  }

  async cloudRun(
    moduleName: string,
    options: { version?: string; args?: string[]; image?: string } = {}
  ): Promise<{ actionId: string }> {
    return this.callTool('cloud_run', {
      moduleName,
      moduleVersion: options.version,
      args: options.args,
      image: options.image,
    });
  }
}
