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

  async listModules(): Promise<Module[]> {
    return this.callTool<Module[]>('list_modules', {});
  }

  async publishModule(modulePath: string): Promise<{ success: boolean; version?: string }> {
    return this.callTool('publish_module', { modulePath });
  }

  async runModule(moduleName: string, args?: Record<string, any>): Promise<{ jobId: string }> {
    return this.callTool('run_module', { moduleName, args: args || {} });
  }

  async listData(prefix?: string): Promise<DataItem[]> {
    return this.callTool<DataItem[]>('list_data', { prefix: prefix || '' });
  }

  async getData(path: string): Promise<{ url: string }> {
    return this.callTool('get_data', { path });
  }

  async uploadData(localPath: string, remotePath: string): Promise<{ success: boolean }> {
    return this.callTool('upload_data', { localPath, remotePath });
  }

  async listAgents(): Promise<Agent[]> {
    return this.callTool<Agent[]>('list_agents', {});
  }

  async startAgent(agentId: string): Promise<{ success: boolean }> {
    return this.callTool('agent_start', { agentId });
  }

  async getProjectInfo(): Promise<ProjectInfo> {
    return this.callTool<ProjectInfo>('project_info', {});
  }
}
