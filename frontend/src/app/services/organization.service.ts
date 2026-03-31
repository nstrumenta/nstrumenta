import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, query, getFirestore, DocumentData } from 'firebase/firestore';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OrganizationDoc } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  getUserOrganizations(): Observable<OrganizationDoc[]> {
    return this.authService.user$.pipe(
      switchMap(async user => {
        if (!user) return of([]);
        const url = await this.apiService.getApiUrl();
        const idToken = await user.getIdToken();
        const headers = new HttpHeaders()
          .set('Authorization', `Bearer ${idToken}`)
          .set('Accept', 'application/json');
        return this.http.get<OrganizationDoc[]>(`${url}/api/orgs`, { headers });
      }),
      switchMap(obs => obs)
    );
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
