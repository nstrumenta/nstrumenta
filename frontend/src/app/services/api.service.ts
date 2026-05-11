import { ProjectRoles } from "../models/projectSettings.model";
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { getNstConfig } from '../nst-config';

export interface CreateProjectRequest {
  name: string;
  projectIdBase?: string;
  orgId?: string;
}

export interface CreateProjectResponse {
  id: string;
  slug: string;
  orgSlug: string;
  name: string;
  message: string;
}

export interface CreateApiKeyRequest {
  projectId: string;
  apiUrl: string;
}

export interface CreateApiKeyResponse {
  key: string;
  keyId: string;
  createdAt: number;
  message: string;
}

export interface UploadDataResponse {
  uploadUrl: string;
  filePath: string;
}

export interface InviteProjectMemberRequest {
  projectId: string;
  email: string;
  role: ProjectRoles;
}

export interface InviteProjectMemberResponse {
  invitationId: string;
  email: string;
  status: 'pending' | 'accepted';
  existingUser: boolean;
}

export interface AcceptProjectInvitationRequest {
  orgId: string;
  projectId: string;
  invitationId: string;
}

export interface AcceptProjectInvitationResponse {
  accepted: boolean;
  orgId: string;
  projectId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrlCache: string | null = null;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private extractMcpResult(response: any, toolName: string): any {
    if (response.error) {
      throw new Error(response.error.message || `MCP tool ${toolName} failed`);
    }
    if (response.result?.isError) {
      const errorText = Array.isArray(response.result.content)
        ? response.result.content.map((c: any) => c.text).join('\n')
        : `MCP tool ${toolName} returned an error`;
      throw new Error(errorText);
    }
    return response.result?.structuredContent || response.result;
  }

  private async buildMcpHeaders(projectId?: string): Promise<HttpHeaders> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    const idToken = await user.getIdToken();
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${idToken}`)
      .set('Accept', 'application/json, text/event-stream');
    if (projectId) {
      headers = headers.set('x-nstrumenta-project-id', projectId);
    }
    return headers;
  }

  public async getApiUrl(): Promise<string> {
    if (this.apiUrlCache) {
      return this.apiUrlCache;
    }
    //use apiUrl from query argument if present
    const urlParams = new URLSearchParams(window.location.search);
    const apiUrl = urlParams.get('apiUrl');
    if (apiUrl) {
      this.apiUrlCache = apiUrl;
      return apiUrl;
    }

    // Fetch the API URL from config
    const config = await getNstConfig();

    if (!config.apiUrl) {
      throw new Error(
        `Invalid config: missing 'apiUrl' property`
      );
    }

    this.apiUrlCache = config.apiUrl;
    return config.apiUrl;
  }

  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders();

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: 'create_project',
        arguments: {
          name: request.name,
          projectIdBase: request.projectIdBase,
          ...(request.orgId ? { orgId: request.orgId } : {})
        }
      }
    };

    const response = await this.http.post<any>(
      `${apiUrl}/mcp`,
      mcpRequest,
      { headers }
    ).toPromise();

    const result = this.extractMcpResult(response, 'create_project');
    return {
      id: result.id,
      slug: result.slug,
      orgSlug: result.orgSlug,
      name: result.name,
      message: result.message
    };
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(request.projectId);

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: 'create_api_key',
        arguments: {
          projectId: request.projectId,
          apiUrl: request.apiUrl
        }
      }
    };

    const response = await this.http.post<any>(
      `${apiUrl}/mcp`,
      mcpRequest,
      { headers }
    ).toPromise();

    const result = this.extractMcpResult(response, 'create_api_key');
    return {
      key: result.key,
      keyId: result.keyId,
      createdAt: result.createdAt,
      message: result.message
    };
  }

  async inviteProjectMember(request: InviteProjectMemberRequest): Promise<InviteProjectMemberResponse> {
    const [orgId, projectId] = request.projectId.split('/');
    if (!orgId || !projectId || request.projectId.split('/').length !== 2) {
      throw new Error(`Invalid projectId format '${request.projectId}': expected 'orgSlug/projectSlug'`);
    }

    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(request.projectId);

    const response = await this.http.post<InviteProjectMemberResponse>(
      `${apiUrl}/api/orgs/${orgId}/projects/${projectId}/invitations`,
      {
        email: request.email,
        role: request.role,
      },
      { headers },
    ).toPromise();

    if (!response) {
      throw new Error('Empty response from project invitation endpoint');
    }

    return response;
  }

  async acceptProjectInvitation(request: AcceptProjectInvitationRequest): Promise<AcceptProjectInvitationResponse> {
    const fullProjectId = `${request.orgId}/${request.projectId}`;
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(fullProjectId);

    const response = await this.http.post<AcceptProjectInvitationResponse>(
      `${apiUrl}/api/orgs/${request.orgId}/projects/${request.projectId}/invitations/${request.invitationId}/accept`,
      {},
      { headers },
    ).toPromise();

    if (!response) {
      throw new Error('Empty response from project invitation acceptance endpoint');
    }

    return response;
  }


  async uploadFileToPath(
    path: string,
    file: File | Blob,
    projectId?: string,
    metadata?: Record<string, string>
  ): Promise<Observable<number>> {
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(projectId);

    const contentType = file.type || 'application/octet-stream';
    const finalMetadata = { ...metadata };
    if (!finalMetadata['contentType'] && !finalMetadata['content-type']) {
      finalMetadata['contentType'] = contentType;
    }

    // Call MCP endpoint to get generic upload URL
    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: 'get_upload_url',
        arguments: {
          path, // "data/filename.mcap"
          metadata: finalMetadata,
        },
      },
    };

    const mcpResponse = await this.http
      .post<any>(`${apiUrl}/mcp`, mcpRequest, { headers })
      .toPromise();

    const result = this.extractMcpResult(mcpResponse, 'get_upload_url');
    const uploadUrl = result.uploadUrl;

    if (!uploadUrl) {
      throw new Error('MCP missing uploadUrl in response');
    }

    return this.http
      .put(uploadUrl, file, {
        headers: new HttpHeaders({
          'Content-Type': contentType,
        }),
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event: HttpEvent<unknown>) => {
          if (event.type === HttpEventType.UploadProgress) {
            return event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
          } else if (event.type === HttpEventType.Response) {
            return 100;
          }
          return 0;
        }),
        catchError((error) => {
          // Status 0 or 'Unknown Error' means CORS blocked the response
          // but the upload likely succeeded
          if (error.status === 0) {
            return of(100);
          }
          throw error;
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  async getDownloadUrl(filePath: string, projectId?: string): Promise<string> {
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(projectId);

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: 'get_download_url',
        arguments: { path: filePath },
      },
    };

    const mcpResponse = await this.http
      .post<any>(`${apiUrl}/mcp`, mcpRequest, { headers })
      .toPromise();

    const result = this.extractMcpResult(mcpResponse, 'get_download_url');
    const downloadUrl = result.downloadUrl;
    
    if (!downloadUrl) {
      throw new Error('MCP missing downloadUrl in response');
    }
    
    return downloadUrl;
  }

  async deleteFile(filePath: string, firestoreDocId: string | undefined, projectId?: string): Promise<void> {
    const apiUrl = await this.getApiUrl();
    const headers = await this.buildMcpHeaders(projectId);

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: 'delete_file',
        arguments: { filePath, ...(firestoreDocId ? { firestoreDocId } : {}) },
      },
    };

    const mcpResponse = await this.http
      .post<any>(`${apiUrl}/mcp`, mcpRequest, { headers })
      .toPromise();

    this.extractMcpResult(mcpResponse, 'delete_file');
  }

}
