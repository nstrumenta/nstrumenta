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
  private apiKey?: string;

  constructor(config: MCPClientConfig) {
    this.apiKey = config.apiKey;
    
    const configuredUrl = vscode.workspace.getConfiguration('nstrumenta').get<string>('mcpServer.url');
    
    if (configuredUrl && configuredUrl !== 'http://localhost:3100') {
      this.serverUrl = configuredUrl;
    } else if (config.serverUrl) {
      this.serverUrl = config.serverUrl;
    } else if (config.apiKey) {
      this.serverUrl = this.extractServerUrlFromApiKey(config.apiKey);
    } else {
      this.serverUrl = 'http://localhost:3100';
    }
  }

  private extractServerUrlFromApiKey(apiKey: string): string {
    try {
      const parts = apiKey.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.mcpServerUrl) {
          return payload.mcpServerUrl;
        }
      }
    } catch (error) {
      console.error('Failed to parse API key:', error);
    }
    return 'http://localhost:3100';
  }

  private async callTool<T>(toolName: string, args: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.serverUrl}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        name: toolName,
        arguments: args
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP tool call failed: ${response.status} ${errorText}`);
    }

    const result = await response.json() as any;
    
    if (result.isError) {
      throw new Error(`MCP tool error: ${result.content?.[0]?.text || 'Unknown error'}`);
    }

    return result.content?.[0]?.text ? JSON.parse(result.content[0].text) : result as T;
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
