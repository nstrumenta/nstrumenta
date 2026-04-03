import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { OrganizationDoc } from '../models/organization.model';

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
    const headers = await (this.apiService as any).buildMcpHeaders();
    return firstValueFrom(
      this.http.post<OrganizationDoc>(
        `${url}/api/orgs`,
        { name, slug },
        { headers }
      )
    );
  }
}
