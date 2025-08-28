import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>Are you sure?</h2>
    <div mat-dialog-actions>
      <button mat-button (click)="close()">Cancel</button>
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Confirm</button>
    </div>
  `,
  styles: [],
})
export class ConfirmationDialogComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<boolean>) {}

  ngOnInit(): void {}

  close() {
    this.dialogRef.close();
  }
}
