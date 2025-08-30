import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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
}
