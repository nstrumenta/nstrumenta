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

@Component({
    selector: 'app-create-key-dialog',
    templateUrl: `create-key-dialog.component.html`,
    styles: [],
    standalone: true,
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

    this.projectService.createApiKey()
      .then(response => {
        if (response) {
          this.response.keyId = response.keyId;
          this.response.createdAt = new Date(response.createdAt).toISOString();
          this.key = response.key;
          console.log('createApiKey response', response);
        }
      })
      .catch(error => {
        console.error('Failed to create API key:', error);
        // Optionally, close the dialog with an error message
        this.dialogRef.close({ error: 'Failed to create API key' });
      });
  }

  close() {
    this.dialogRef.close();
  }
}
