import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styles: [],
    standalone: false
})
export class ConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<boolean>);

  close() {
    this.dialogRef.close();
  }
}
