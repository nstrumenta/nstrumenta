import * as vscode from 'vscode';

export interface Project {
  id: string;
  name: string;
  description?: string;
  members?: Record<string, any>;
}

export interface ApiKeyResponse {
  key: string;
  keyId: string;
  createdAt: number;
  message?: string;
}

export class CloudApiClient {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || this.getDefaultApiUrl();
  }

  private getDefaultApiUrl(): string {
    const configured = vscode.workspace.getConfiguration('nstrumenta').get<string>('cloudApi.url');
    return configured || 'https://api.nstrumenta.com';
  }

  async listProjects(firebaseIdToken: string): Promise<Project[]> {
    const response = await fetch(`${this.apiUrl}/listProjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseIdToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list projects: ${response.status} ${errorText}`);
    }

    const data = await response.json() as { projects?: Project[] };
    return data.projects || [];
  }

  async getProject(projectId: string, firebaseIdToken: string): Promise<Project> {
    const response = await fetch(`${this.apiUrl}/getProject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseIdToken}`
      },
      body: JSON.stringify({ projectId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get project: ${response.status} ${errorText}`);
    }

    return await response.json() as Project;
  }

  async createApiKey(projectId: string, firebaseIdToken: string): Promise<ApiKeyResponse> {
    const response = await fetch(`${this.apiUrl}/createApiKey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseIdToken}`
      },
      body: JSON.stringify({ projectId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create API key: ${response.status} ${errorText}`);
    }

    return await response.json() as ApiKeyResponse;
  }
}
