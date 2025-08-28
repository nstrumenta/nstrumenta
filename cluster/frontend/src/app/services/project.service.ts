import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, docData, setDoc, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProjectSettings } from '../models/projectSettings.model';
import { ServerService } from './server.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  // Inject services using the new Angular 19 pattern
  private authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private serverService = inject(ServerService);
  private apiService = inject(ApiService);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  currentProject = new BehaviorSubject<string>('');
  projects: Observable<any[]>;
  user: User;
  currentProjectId: string;
  projectSettings: ProjectSettings;

  constructor() {
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user) {
        this.user = user;
        const projectsCollection = collection(this.firestore, `users/${user.uid}/projects`);
        this.projects = collectionData(projectsCollection, { idField: 'key' });
      }
    });
    this.activatedRoute.paramMap.subscribe();
  }

  setProject(id: string) {
    console.log('setProject', id);
    // only update or add to projects if the user has access to /project/${id}
    const userProjectsCollection = collection(this.firestore, `users/${this.user.uid}/projects`);
    const sub = collectionData(userProjectsCollection, { idField: 'key' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async (projects) => {
      try {
        const projectDocRef = doc(this.firestore, `projects/${id}`);
        const projectDoc = await getDoc(projectDocRef);
        
        if (projectDoc.exists()) {
          this.projectSettings = projectDoc.data() as ProjectSettings;
          const lastOpened = Date.now();
          
          const userProjectDocRef = doc(this.firestore, `users/${this.user.uid}/projects/${id}`);
          await setDoc(userProjectDocRef, { 
            name: this.projectSettings.name, 
            lastOpened 
          });
        }
        sub.unsubscribe();
      } catch (error) {
        console.error('Error setting project:', error);
        sub.unsubscribe();
      }
    });

    this.currentProjectId = id;
    this.currentProject.next(id);
  }

  async createApiKey() {
    if (!this.currentProjectId) return;
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
    if (!this.currentProjectId) return;
    return this.serverService.runServerTask(
      'revokeApiKey',
      this.currentProjectId,
      { keyId },
      console.log
    );
  }
}
