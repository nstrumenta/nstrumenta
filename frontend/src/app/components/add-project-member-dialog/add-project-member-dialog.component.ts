import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { ProjectRoles } from 'src/app/models/projectSettings.model';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

export interface AddProjectMemberDialogResponse {
  email?: string;
  role: ProjectRoles;
}

@Component({
    selector: 'app-add-project-member-dialog',
    template: `
    <h2 mat-dialog-title>Invite Project Member</h2>
    <mat-dialog-content class="mat-typography">
      <div class="member-form-row">
        <mat-form-field class="email-field">
          <mat-label>Email address</mat-label>
          <input matInput [(ngModel)]="response.email" type="email" />
        </mat-form-field>

        <mat-form-field class="role-field">
          <mat-label>Role</mat-label>
          <mat-select [(value)]="response.role">
            <mat-option value="admin">admin</mat-option>
            <mat-option value="viewer">viewer</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Cancel</button>
      <button mat-button [mat-dialog-close]="response" cdkFocusInitial>Invite</button>
    </div>
  `,
    styles: [`
      .member-form-row {
        display: flex;
        gap: 8px;
      }
      .email-field {
        flex: 1;
      }
      .role-field {
        width: 120px;
      }
    `],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, FormsModule, MatSelect, MatOption, MatDialogActions, MatButton, MatDialogClose]
})
export class AddProjectMemberDialogComponent {
  public dialogRef = inject(MatDialogRef<AddProjectMemberDialogResponse>);

  response: AddProjectMemberDialogResponse = { role: 'viewer' };

  close() {
    this.dialogRef.close();
  }
}
