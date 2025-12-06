import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FirebaseDataService } from './firebase-data.service';

export type AgentTask = 'runModule';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  uid: string;
  private firebaseDataService = inject(FirebaseDataService);
  private authService = inject(AuthService);

  constructor() {
    this.authService.user.subscribe((user) => {
      if (user) {
        this.uid = user.uid;
      } else {
        this.uid = '';
      }
    });
  }

  runAgentTask(
    task: AgentTask,
    projectId: string,
    payload?: unknown,
    progress?: (message: string) => void
  ): Promise<unknown> {
    return this.firebaseDataService.runTask(task, projectId, this.uid, payload, undefined, progress);
  }
}
