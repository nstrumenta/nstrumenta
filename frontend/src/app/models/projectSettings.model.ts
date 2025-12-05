export type ProjectRoles = 'owner' | 'admin' | 'viewer';
export interface ApiKeyInfo { 
  createdAt: string;
  lastUsed?: number;
}

export interface ProjectSettings {
  agentType?: 'master';
  name?: string;
  members?: Record<string, ProjectRoles>;
  apiKeys?: Record<string, ApiKeyInfo>;
  apiUrl?: string;
}
