import * as vscode from 'vscode';

export interface MCPClientConfig {
  apiKey?: string;
  serverUrl?: string;
}

export interface Module {
  id: string;
  name: string;
  version: string;
  description?: string;
}

export interface DataItem {
  path: string;
  size: number;
  modified: string;
}

export interface Agent {
  id: string;
  name: string;
  status: string;
  lastSeen?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
}

export class MCPClient {
  private serverUrl: string;
  private apiKey: string;

  constructor(config: MCPClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for MCP client');
    }
    
    if (!config.serverUrl) {
      throw new Error('Server URL is required for MCP client');
    }
    
    this.apiKey = config.apiKey;
    this.serverUrl = config.serverUrl;
  }

  private async callTool<T>(toolName: string, args: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.serverUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: Date.now()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json() as any;
    
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
    
    return toolResult.content?.[0]?.text ? JSON.parse(toolResult.content[0].text) : toolResult as T;
  }

  async listModules(filter?: string): Promise<{ modules: Module[] }> {
    return this.callTool('list_modules', { filter });
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

  async setAgentAction(agentId: string, action: string): Promise<{ actionId: string }> {
    return this.callTool('set_agent_action', {
      agentId,
      action,
    });
  }

  async cleanAgentActions(agentId: string): Promise<{ success: boolean }> {
    return this.callTool('clean_agent_actions', {
      agentId,
    });
  }

  async listData(type: string = 'data'): Promise<{ objects: DataItem[] }> {
    return this.callTool('list_data', { type });
  }

  async getAgentActions(agentId: string, status: string = 'pending'): Promise<{ actions: any[] }> {
    return this.callTool('get_agent_actions', {
      agentId,
      status,
    });
  }

  async updateAgentAction(
    agentId: string,
    actionId: string,
    status: string,
    error?: string
  ): Promise<{ success: boolean }> {
    return this.callTool('update_agent_action', {
      agentId,
      actionId,
      status,
      error,
    });
  }
}
