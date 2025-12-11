import * as vscode from 'vscode';
import { AuthProvider, UserInfo } from './authProvider';

interface ProjectInfo {
  id: string;
  name: string;
}

export class SessionManager {
  private apiKey: string | null = null;
  private projectId: string | null = null;
  private mcpServerUrl: string | null = null;
  private onSessionChangedEmitter = new vscode.EventEmitter<boolean>();
  public readonly onSessionChanged = this.onSessionChangedEmitter.event;

  constructor(
    private context: vscode.ExtensionContext,
    private authProvider: AuthProvider
  ) {
    this.authProvider.onAuthStateChanged((user) => {
      if (!user) {
        this.clearSession();
      }
    });
  }

  async initialize(): Promise<void> {
    await this.authProvider.restoreSession();
    await this.restoreApiKey();
    await this.restoreProjectId();
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    await this.context.secrets.store('nstrumenta.apiKey', apiKey);
    
    this.mcpServerUrl = this.extractServerUrlFromApiKey(apiKey);
    if (this.mcpServerUrl) {
      await this.context.globalState.update('nstrumenta.mcpServerUrl', this.mcpServerUrl);
    }
    
    this.onSessionChangedEmitter.fire(true);
  }

  async getApiKey(): Promise<string | null> {
    if (!this.apiKey) {
      await this.restoreApiKey();
    }
    return this.apiKey;
  }

  getMcpServerUrl(): string {
    if (this.mcpServerUrl) {
      return this.mcpServerUrl;
    }
    
    const configuredUrl = vscode.workspace.getConfiguration('nstrumenta').get<string>('mcpServer.url');
    if (configuredUrl) {
      return configuredUrl;
    }
    
    throw new Error('MCP server URL not configured. Please set a valid API key with server URL encoded.');
  }

  async setProjectId(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.context.globalState.update('nstrumenta.projectId', projectId);
    this.onSessionChangedEmitter.fire(true);
  }

  getProjectId(): string | null {
    return this.projectId;
  }

  async selectProject(projects: ProjectInfo[]): Promise<ProjectInfo | undefined> {
    const items = projects.map(p => ({
      label: p.name,
      description: p.id,
      project: p
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a project',
      matchOnDescription: true
    });

    if (selected) {
      await this.setProjectId(selected.project.id);
      return selected.project;
    }

    return undefined;
  }

  hasSession(): boolean {
    return this.apiKey !== null && this.projectId !== null;
  }

  async clearSession(): Promise<void> {
    this.apiKey = null;
    this.projectId = null;
    this.mcpServerUrl = null;
    
    await this.context.secrets.delete('nstrumenta.apiKey');
    await this.context.globalState.update('nstrumenta.projectId', undefined);
    await this.context.globalState.update('nstrumenta.mcpServerUrl', undefined);
    
    this.onSessionChangedEmitter.fire(false);
  }

  private async restoreApiKey(): Promise<void> {
    const storedKey = await this.context.secrets.get('nstrumenta.apiKey');
    if (storedKey) {
      this.apiKey = storedKey;
      this.mcpServerUrl = this.extractServerUrlFromApiKey(storedKey);
    }
  }

  private async restoreProjectId(): Promise<void> {
    const storedProjectId = this.context.globalState.get<string>('nstrumenta.projectId');
    if (storedProjectId) {
      this.projectId = storedProjectId;
    }
  }

  private extractServerUrlFromApiKey(apiKey: string): string | null {
    try {
      const parts = apiKey.split(':');
      if (parts.length >= 2) {
        const encodedUrl = parts[1];
        const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
        
        if (decodedUrl && (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://'))) {
          return decodedUrl;
        }
      }
    } catch (error) {
      console.error('Failed to extract server URL from API key:', error);
    }
    return null;
  }

  getSessionInfo(): {
    hasApiKey: boolean;
    hasProject: boolean;
    projectId: string | null;
    mcpServerUrl: string | null;
    user: UserInfo | null;
  } {
    return {
      hasApiKey: this.apiKey !== null,
      hasProject: this.projectId !== null,
      projectId: this.projectId,
      mcpServerUrl: this.mcpServerUrl,
      user: this.authProvider.getCurrentUser()
    };
  }
}
