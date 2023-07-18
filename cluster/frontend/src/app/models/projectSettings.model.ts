export type ProjectRoles = 'owner' | 'admin' | 'viewer';
export type ApiKeyInfo = { createdAt: string }

export class ProjectSettings {
  agentType?: 'master';
  name?: string;
  members?: { [key: string]: ProjectRoles; };
  apiKeys?: { [key: string]: ApiKeyInfo };
}
