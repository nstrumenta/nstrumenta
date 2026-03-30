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
      switchMap(user => {
        if (!user) return of([]);
        // We will implement actual fetching shortly. 
        // For now relying on standard HTTP routes to circumvent missing @angular/fire exports.
        return of([]);
      })
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
