import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { ProjectService } from 'src/app/services/project.service';

import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { MatIcon } from '@angular/material/icon';

export interface CreateKeyDialogResponse {
  keyId?: string;
  createdAt?: string;
}

interface ServerApiKeyResponse {
  payload: {
    keyId: string;
    key: string;
  };
  created: string;
}

@Component({
    selector: 'app-create-key-dialog',
    templateUrl: `create-key-dialog.component.html`,
    styles: [],
    imports: [MatDialogTitle, MatProgressSpinner, CdkScrollable, MatDialogContent, MatButton, CdkCopyToClipboard, MatIcon, MatDialogActions, MatDialogClose]
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
      const typedResponse = actionResponse as ServerApiKeyResponse;
      this.response.keyId = typedResponse.payload.keyId;
      this.response.createdAt = typedResponse.created;
      this.key = typedResponse.payload.key;
      console.log('createApiKey response', actionResponse);
    });
  }

  close() {
    this.dialogRef.close();
  }
}
