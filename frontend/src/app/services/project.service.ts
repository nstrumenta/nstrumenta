import { Injectable, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from 'firebase/auth';
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
  private serverService = inject(ServerService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);

  currentProject = new BehaviorSubject<string>('');
  projects: Observable<Project[]>;
  user: User;
  
  get currentProjectId() {
    return this.firebaseDataService.projectId();
  }
  
  projectSettings: ProjectSettings;

  constructor() {
    this.authService.user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) {
        this.user = user;
        this.firebaseDataService.setUser(user.uid);
        this.projects = this.firebaseDataService.userProjectsObservable$;
      }
    });
    
    effect(() => {
      this.currentProject.next(this.currentProjectId);
    });
  }

  setProject(id: string) {
    // Left just in case something else expects to set the ID via project service instead of navigation
    this.firebaseDataService.setProject(id);
  }

  async createApiKey() {
    const projectId = this.currentProjectId;
    
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    
    const apiUrl = await this.apiService.getApiUrl();
    return this.apiService.createApiKey({
      projectId: projectId,
      apiUrl,
    });
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
