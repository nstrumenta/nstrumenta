import { Injectable } from '@angular/core';
import { ProjectService } from './project.service';
import { ServerService } from './server.service';

@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  constructor(
    private serverService: ServerService,
    private projectService: ProjectService,
  ) {
  }

  archiveCurrentProject(): void {
    const projectId = this.projectService.currentProjectId;

    this.archiveProject(projectId);
  }

  duplicateCurrentProject(name: string, requestingUserId): void {
    const projectId = this.projectService.currentProjectId;

    this.duplicateProject(projectId, name, requestingUserId);
  }


  async archiveProject(projectId: string) {
    if (!projectId) {
      console.log('no path given for project doc to archive');
    }

    const payload = { projectId };
    console.log(`let's archive ${projectId}`);
    this.serverService.runServerTask(
      'archiveProject',
      projectId,
      payload,
    ).catch((error) => {
      console.log('archive failed with', error);
    });
  }

  async duplicateProject(projectId: string, duplicateName: string, requestingUserId: string) {
    if (!projectId) {
      console.log('no path given for project doc to archive');
    }

    // TODO: Make sure this is a project and not some random document

    const payload = { projectId, duplicateName, requestingUserId };

    console.log(`let's DUPLICATE ${projectId} to ${duplicateName}`);
    this.serverService.runServerTask(
      'duplicateProject',
      projectId,
      payload,
    ).catch((error) => {
      console.log('duplicate failed with', error);
    });
  }

}
