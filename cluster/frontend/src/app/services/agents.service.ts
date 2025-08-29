import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { FirebaseDataService } from './firebase-data.service';

export type AgentTask = 'runModule';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  uid: string;
  private firebaseDataService = inject(FirebaseDataService);

  constructor(private authService: AuthService) {
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
    payload?: any,
    progress?: (message: string) => void
  ): Promise<any> {
    return this.firebaseDataService.runTask(task, projectId, this.uid, payload, undefined, progress);
  }
}
