import { Injectable, inject, DestroyRef, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProjectSettings } from '../models/projectSettings.model';
import { Project } from '../models/firebase.model';
import { ServerService } from './server.service';
import { ApiService } from './api.service';
import { FirebaseDataService } from './firebase-data.service';
import { ProjectRoles } from '../models/projectSettings.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private authService = inject(AuthService);
  private serverService = inject(ServerService);
  private apiService = inject(ApiService);
  private firebaseDataService = inject(FirebaseDataService);

  currentProject = new BehaviorSubject<string>('');
  projects: Observable<Project[]>;

  get currentProjectId() {
    return this.firebaseDataService.projectId();
  }

  projectSettings: ProjectSettings;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.firebaseDataService.setUser(user.uid);
        this.projects = this.firebaseDataService.userProjectsObservable$;
      }
    });

    effect(() => {
      this.currentProject.next(this.currentProjectId);
    });
  }

  setProject(id: string) {
    this.firebaseDataService.setProject(id);
  }

  async createApiKey() {
    const projectId = this.currentProjectId;
    
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    
    const apiUrl = await this.apiService.getApiUrl();
    const response = await this.apiService.createApiKey({
      projectId: projectId,
      apiUrl,
    });
    this.firebaseDataService.refreshProjectSettings();
    return response;
  }

  async revokeApiKey(keyId: string) {
    const response = await this.serverService.runServerTask(
      'revokeApiKey',
      this.currentProjectId,
      { keyId },
      console.log
    );
    this.firebaseDataService.refreshProjectSettings();
    return response;
  }

  async inviteProjectMember(request: { email: string; role: ProjectRoles }) {
    const projectId = this.currentProjectId;
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    return this.apiService.inviteProjectMember({
      projectId,
      email: request.email,
      role: request.role,
    });
  }

  async updateProjectMemberRole(request: { memberId: string; role: ProjectRoles }) {
    const projectId = this.currentProjectId;
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    const response = await this.apiService.updateProjectMemberRole({
      projectId,
      memberId: request.memberId,
      role: request.role,
    });
    this.firebaseDataService.refreshProjectSettings();
    return response;
  }

  async removeProjectMember(memberId: string) {
    const projectId = this.currentProjectId;
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    const response = await this.apiService.removeProjectMember({
      projectId,
      memberId,
    });
    this.firebaseDataService.refreshProjectSettings();
    return response;
  }

  async revokeProjectInvitation(invitationId: string) {
    const projectId = this.currentProjectId;
    if (!projectId) {
      throw new Error('No project selected. Please select a project first.');
    }
    return this.firebaseDataService.deleteProjectInvitation(projectId, invitationId);
  }
}
