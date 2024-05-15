import { Injectable } from '@angular/core';
import { User } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProjectSettings } from '../models/projectSettings.model';
import { ServerService } from './server.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  currentProject = new BehaviorSubject<string>('');
  projects: Observable<any[]>;
  user: User;
  currentProjectId: string;
  projectSettings: ProjectSettings;

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private activatedRoute: ActivatedRoute,
    private serverService: ServerService
  ) {
    this.authService.user.subscribe((user) => {
      if (user) {
        this.user = user;
        this.projects = this.afs
          .collection<any>('/users/' + user.uid + '/projects')
          .valueChanges({ idField: 'key' });
      }
    });
    this.activatedRoute.paramMap.subscribe();
  }

  setProject(id: string) {
    console.log('setProject', id);
    // only update or add to projects if the user has access to /project/${id}
    const sub = this.afs
      .collection<any>('/users/' + this.user.uid + '/projects')
      .valueChanges({ idField: 'key' })
      .subscribe((projects) => {
        this.afs
          .doc(`/projects/${id}/`)
          .get()
          .toPromise()
          .then((results) => {
            this.projectSettings = results.data();
            const lastOpened = Date.now();
            this.afs
              .collection<any>('/users/' + this.user.uid + '/projects')
              .doc(id)
              .set({ name: this.projectSettings.name, lastOpened });
            sub.unsubscribe();
          });
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
