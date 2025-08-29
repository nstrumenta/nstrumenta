import { Component, OnInit } from '@angular/core';
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
export class CreateKeyDialogComponent implements OnInit {
  response: CreateKeyDialogResponse;
  // key is intentionally local to this dialog and is not stored in the db
  key = '';

  constructor(private dialogRef: MatDialogRef<CreateKeyDialogComponent>, private projectService: ProjectService) {
    this.response = {};

    this.projectService.createApiKey().then(actionResponse => {
      this.response.keyId = actionResponse.payload.keyId;
      this.response.createdAt = actionResponse.created;
      this.key = actionResponse.payload.key;
      console.log('createApiKey response', actionResponse);
    })
  }

  ngOnInit(): void { }

  close() {
    this.dialogRef.close();
  }
}
