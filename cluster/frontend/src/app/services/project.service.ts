import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProjectSettings } from '../models/projectSettings.model';
import { Project } from '../models/firebase.model';
import { ServerService } from './server.service';
import { ApiService } from './api.service';
import { FirebaseDataService } from './firebase-data.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  // Inject services using the new Angular 20 pattern
  private authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private serverService = inject(ServerService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);

  currentProject = new BehaviorSubject<string>('');
  projects: Observable<Project[]>;
  user: User;
  currentProjectId: string;
  projectSettings: ProjectSettings;

  constructor() {
    this.authService.user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) {
        this.user = user;
        this.firebaseDataService.setUser(user.uid);
        this.projects = this.firebaseDataService.userProjectsObservable$;
      }
    });

    // Watch route parameters for project changes
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap) => {
      const projectId = paramMap.get('projectId');
      if (projectId) {
        this.setProject(projectId);
      }
    });
  }

  setProject(id: string) {
    console.log('setProject', id);
    this.currentProjectId = id;
    this.currentProject.next(id);
    this.firebaseDataService.setProject(id);
  }

  async createApiKey() {
    //getApiUrl from api.service
    const apiUrl = await this.apiService.getApiUrl();

    return this.serverService.runServerTask(
      'createApiKey',
      this.currentProjectId,
      { apiUrl },
      console.log
    );
  }

  async revokeApiKey(keyId: string) {
    return this.serverService.runServerTask(
      'revokeApiKey',
      this.currentProjectId,
      { keyId },
      console.log
    );
  }
}
