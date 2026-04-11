import { Injectable, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FirebaseDataService } from './firebase-data.service';

export type ServerTasks =
  | 'archiveProject'
  | 'duplicateProject'
  | 'createApiKey'
  | 'revokeApiKey'
  | 'deployCloudAgent'
  | 'deleteDeployedCloudAgent'
  | 'cloudRun'
  | 'buildFromGithub'
  | 'buildFromFolder'
  | 'gitToken';
@Injectable({
  providedIn: 'root',
})
export class ServerService {
  uid: string;
  private firebaseDataService = inject(FirebaseDataService);
  private authService = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.uid = user ? user.uid : '';
    });
  }

  runServerTask(
    task: ServerTasks,
    projectId: string,
    payload?: unknown,
    progress?: (message: string) => void,
    data?: unknown
  ): Promise<unknown> {
    return this.firebaseDataService.runTask(task, projectId, this.uid, payload, data, progress);
  }
}
