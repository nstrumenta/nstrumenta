import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreAdapter, User } from '@nstrumenta/data-adapter';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProjectSettings } from '../models/projectSettings.model';
import { ServerService } from './server.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  currentProject = new BehaviorSubject<string>('');
  projects: Observable<any[]>;
  user: User | null;
  currentProjectId: string;
  projectSettings: ProjectSettings;

  constructor(
    private authService: AuthService,
    private firestoreAdapter: FirestoreAdapter,
    private activatedRoute: ActivatedRoute,
    private serverService: ServerService
  ) {
    this.projects = this.authService.user.pipe(
      switchMap((user) => {
        if (user) {
          this.user = user;
          return this.firestoreAdapter.collection$<any>('/users/' + user.uid + '/projects');
        } else {
          this.user = null;
          return of([]);
        }
      })
    );
    this.activatedRoute.paramMap.subscribe();
  }

  setProject(id: string) {
    console.log('setProject', id);
    // only update or add to projects if the user has access to /project/${id}
    this.firestoreAdapter.doc$<ProjectSettings>(`/projects/${id}/`).subscribe((projectSettings) => {
      if (projectSettings) {
        this.projectSettings = projectSettings;
        const lastOpened = Date.now();
        if (this.user) {
          this.firestoreAdapter.setDoc('/users/' + this.user.uid + '/projects/' + id, {
            name: this.projectSettings.name,
            lastOpened,
          });
        }
      }
    });

    this.currentProjectId = id;
    this.currentProject.next(id);
  }

  async createApiKey() {
    if (!this.currentProjectId) return;
    console.log(this.projectSettings);
    return this.serverService.runServerTask(
      'createApiKey',
      this.currentProjectId,
      { apiUrl: this.projectSettings.apiUrl },
      console.log
    );
  }

  async revokeApiKey(keyId: string) {
    if (!this.currentProjectId) return;
    return this.serverService.runServerTask(
      'revokeApiKey',
      this.currentProjectId,
      { keyId },
      console.log
    );
  }
}
