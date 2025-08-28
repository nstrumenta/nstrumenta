import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ProjectRoles } from 'src/app/models/projectSettings.model';

export interface AddProjectMemberDialogResponse {
  memberId?: string;
  role: ProjectRoles;
}

@Component({
  selector: 'app-add-project-member-dialog',
  template: `
    <h2 mat-dialog-title>Add Project Member</h2>
    <mat-dialog-content class="mat-typography">
      <mat-form-field style="width: 400px !important">
        <input matInput [(ngModel)]="response.memberId" placeholder="User Id" />
      </mat-form-field>

      <mat-form-field style="width: 90px; margin-left: 8px">
        <mat-select [(value)]="response.role">
          <mat-option value="admin">admin</mat-option>
          <mat-option value="viewer">viewer</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Cancel</button>
      <button mat-button [mat-dialog-close]="response" cdkFocusInitial>Add</button>
    </div>
  `,
  styles: [],
})
export class AddProjectMemberDialogComponent implements OnInit {
  response: AddProjectMemberDialogResponse;

  constructor(private dialogRef: MatDialogRef<AddProjectMemberDialogComponent>) {
    this.response = { role: 'admin' };
  }

  ngOnInit(): void {}

  close() {
    this.dialogRef.close();
  }
}
