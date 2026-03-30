export type ProjectRoles = 'owner' | 'admin' | 'viewer';
export type ProjectVisibility = 'public' | 'private';

export interface ApiKeyInfo { 
  createdAt: string;
  lastUsed?: number;
}

export interface ProjectSettings {
  name?: string;
  orgId?: string;
  visibility?: ProjectVisibility;
  members?: Record<string, ProjectRoles>;
  apiKeys?: Record<string, ApiKeyInfo>;
  apiUrl?: string;
}
