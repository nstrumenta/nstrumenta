import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { ProjectRoles } from 'src/app/models/projectSettings.model';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

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
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatInput, FormsModule, MatSelect, MatOption, MatDialogActions, MatButton, MatDialogClose]
})
export class AddProjectMemberDialogComponent {
  public dialogRef = inject(MatDialogRef<AddProjectMemberDialogResponse>);

  response: AddProjectMemberDialogResponse = { role: 'viewer' };

  close() {
    this.dialogRef.close();
  }
}
