import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

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

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrlCache: string | null = null;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private async buildMcpHeaders(projectId?: string): Promise<HttpHeaders> {
    const user = this.authService.user.value;
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

    // Fetch the API URL from the /config endpoint
    const response = await fetch('/config');
    
    if (!response.ok) {
      throw new Error(
        `Failed to fetch config: ${response.status} ${response.statusText}`
      );
    }

    let config: { apiUrl: string };
    try {
      config = await response.json();
    } catch (error) {
      throw new Error(
        `Failed to parse config: ${error}`
      );
    }

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

    if (response.error) {
      console.error('MCP error response:', response.error);
      throw new Error(response.error.message || 'Failed to create project');
    }

    // Extract result from MCP response
    const result = response.result?.structuredContent || response.result;
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

    if (response.error) {
      throw new Error(response.error.message || 'Failed to create API key');
    }

    // Extract result from MCP response
    const result = response.result?.structuredContent || response.result;
    return {
      key: result.key,
      keyId: result.keyId,
      createdAt: result.createdAt,
      message: result.message
    };
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

    if (mcpResponse.error) {
      throw new Error(mcpResponse.error.message || 'Failed to get upload URL');
    }

    const result = mcpResponse.result?.structuredContent || mcpResponse.result;
    const { uploadUrl } = result;

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

}
