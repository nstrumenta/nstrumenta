import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { OrganizationDoc, OrgMemberDoc } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  readonly organizations = signal<OrganizationDoc[]>([]);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.organizations.set([]);
        return;
      }
      Promise.all([this.apiService.getApiUrl(), user.getIdToken()]).then(([url, idToken]) => {
        const headers = new HttpHeaders()
          .set('Authorization', `Bearer ${idToken}`)
          .set('Accept', 'application/json');
        firstValueFrom(this.http.get<OrganizationDoc[]>(`${url}/api/orgs`, { headers }))
          .then(orgs => this.organizations.set(orgs))
          .catch(() => this.organizations.set([]));
      });
    });
  }

  async createOrganization(name: string, slug?: string): Promise<OrganizationDoc> {
    const url = await this.apiService.getApiUrl();
    // Use type assertion since buildMcpHeaders is private/not in the interface
    const getHeaders = (this.apiService as any).buildMcpHeaders ? (this.apiService as any).buildMcpHeaders.bind(this.apiService) : async () => new HttpHeaders();
    const headers = await getHeaders();
    return firstValueFrom(
      this.http.post<OrganizationDoc>(
        `${url}/api/orgs`,
        { name, slug },
        { headers }
      )
    );
  }

  async getOrgMembers(orgId: string): Promise<OrgMemberDoc[]> {
    const url = await this.apiService.getApiUrl();
    const user = this.authService.currentUser();
    if (!user) return [];
    
    try {
      const idToken = await user.getIdToken();
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${idToken}`)
        .set('Accept', 'application/json');
        
      return await firstValueFrom(
        this.http.get<OrgMemberDoc[]>(`${url}/api/orgs/${orgId}/members`, { headers })
      );
    } catch (e) {
      console.warn('Failed to load org members', e);
      return [];
    }
  }
}
