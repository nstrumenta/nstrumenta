import { Injectable, inject, effect } from '@angular/core';
import { ServerService } from './services/server.service';
import { ProjectService } from './services/project.service';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class VmService {
  private serverService = inject(ServerService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  userId = '';

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) this.userId = user.uid;
    });
  }

  deployCloudAgent(): void {
    const projectId = this.projectService.currentProjectId;

    this.serverService.runServerTask(
      'deployCloudAgent',
      projectId,
      { projectId, userId: this.userId },
      console.log
    );
  }

  deleteDeployedCloudAgent({ instanceId }: { instanceId: string }): void {
    const projectId = this.projectService.currentProjectId;

    this.serverService.runServerTask(
      'deleteDeployedCloudAgent',
      projectId,
      {
        instanceId,
        projectId,
        userId: this.userId,
      },
      console.log
    );
  }
}
