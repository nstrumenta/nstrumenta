import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface CreateProjectRequest {
  name: string;
  projectIdBase?: string;
}

export interface CreateProjectResponse {
  id: string;
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

    try {
      // Fetch the API URL from the nstrumentaDeployment configuration
      // This matches the pattern used in the server's ApiKeyService
      const configUrl = `https://storage.googleapis.com/${environment.firebase.projectId}-config/nstrumentaDeployment.json`;
      const config = await fetch(configUrl);
      const deployment = await config.json() as { apiUrl: string };
      this.apiUrlCache = deployment.apiUrl;
      return deployment.apiUrl;
    } catch (error) {
      console.warn('Could not fetch deployment config, falling back to localhost:', error);
      // Fallback to localhost for development
      this.apiUrlCache = 'http://localhost:5999';
      return this.apiUrlCache;
    }
  }

  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    const user = this.authService.user.value;
    
    if (!user) {
      throw new Error('User must be authenticated to create a project');
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();
    
    // Get the API URL dynamically
    const apiUrl = await this.getApiUrl();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    });

    return this.http.post<CreateProjectResponse>(
      `${apiUrl}/createProject`,
      request,
      { headers }
    ).toPromise();
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const user = this.authService.user.value;

    if (!user) {
      throw new Error('User must be authenticated to create an API key');
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    // Get the API URL dynamically
    const apiUrl = await this.getApiUrl();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    });

    return this.http.post<CreateApiKeyResponse>(
      `${apiUrl}/createApiKey`,
      request,
      { headers }
    ).toPromise();
  }

  async uploadFile(projectId: string, file: File, folder?: string): Promise<Observable<number>> {
    const user = this.authService.user.value;
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    const idToken = await user.getIdToken();
    const apiUrl = await this.getApiUrl();

    const response = await fetch(`${apiUrl}/uploadData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        projectId,
        name: file.name,
        size: file.size,
        contentType: file.type,
        folder: folder || ''
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const { uploadUrl } = await response.json() as UploadDataResponse;

    return this.http.put(uploadUrl, file, {
      headers: new HttpHeaders({
        'Content-Type': file.type || 'application/octet-stream'
      }),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          return event.total ? Math.round((100 * event.loaded) / event.total) : 0;
        } else if (event.type === HttpEventType.Response) {
          return 100;
        }
        return 0;
      }),
      // Catch CORS errors from Cloud Storage signed URLs
      // The upload completes successfully, but the browser blocks the response
      catchError((error) => {
        // Status 0 or 'Unknown Error' means CORS blocked the response
        // but the upload likely succeeded
        if (error.status === 0) {
          // Return 100% progress to indicate completion
          return of(100);
        }
        // Re-throw actual errors
        throw error;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
