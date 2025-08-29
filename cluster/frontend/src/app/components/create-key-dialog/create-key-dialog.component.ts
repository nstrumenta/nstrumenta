import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ProjectService } from 'src/app/services/project.service';

export interface CreateKeyDialogResponse {
  keyId?: string;
  createdAt?: string;
}

@Component({
    selector: 'app-create-key-dialog',
    templateUrl: `create-key-dialog.component.html`,
    styles: [],
    standalone: false
})
export class CreateKeyDialogComponent {
  response: CreateKeyDialogResponse;
  // key is intentionally local to this dialog and is not stored in the db
  key = '';

  private dialogRef = inject(MatDialogRef<CreateKeyDialogComponent>);
  private projectService = inject(ProjectService);

  constructor() {
    this.response = {};

    this.projectService.createApiKey().then(actionResponse => {
      this.response.keyId = actionResponse.payload.keyId;
      this.response.createdAt = actionResponse.created;
      this.key = actionResponse.payload.key;
      console.log('createApiKey response', actionResponse);
    });
  }

  close() {
    this.dialogRef.close();
  }
}
