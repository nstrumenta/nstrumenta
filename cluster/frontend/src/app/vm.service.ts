import { Injectable } from '@angular/core';
import { ServerService } from './services/server.service';
import { ProjectService } from './services/project.service';
import { AuthService } from 'src/app/auth/auth.service';

interface StopDeployedSandboxParameters {
  hostInstanceMachineId: string;
}

@Injectable({
  providedIn: 'root',
})
export class VmService {
  userId = '';

  constructor(
    private serverService: ServerService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {
    this.authService.user.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }

  deployHostedVM(machineType: 'e2-micro' | 'n1-standard-1'): void {
    const projectId = this.projectService.currentProjectId;

    this.serverService.runServerTask(
      'deployHostedVM',
      projectId,
      { projectId, userId: this.userId, machineType },
      console.log
    );
  }

  stopDeployedHostedVM({ hostInstanceMachineId }: StopDeployedSandboxParameters): void {
    const projectId = this.projectService.currentProjectId;

    this.serverService.runServerTask(
      'stopDeployedHostedVM',
      projectId,
      {
        hostInstanceMachineId,
        projectId,
        userId: this.userId,
      },
      console.log
    );
  }

  deleteDeployedHostedVM({ hostInstanceMachineId }: StopDeployedSandboxParameters): void {
    const projectId = this.projectService.currentProjectId;

    this.serverService.runServerTask(
      'deleteDeployedHostedVM',
      projectId,
      {
        hostInstanceMachineId,
        projectId,
        userId: this.userId,
      },
      console.log
    );
  }
}
