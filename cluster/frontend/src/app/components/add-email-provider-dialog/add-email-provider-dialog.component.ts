import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface DialogData {
  description: string;
}

@Component({
    selector: 'app-add-email-provider-dialog',
    templateUrl: './add-email-provider-dialog.component.html',
    styleUrls: ['./add-email-provider-dialog.component.scss'],
    standalone: false
})
export class AddEmailProviderDialogComponent {
  private dialogRef = inject(MatDialogRef<boolean>);
  public data: DialogData = inject(MAT_DIALOG_DATA);

  close() {
    this.dialogRef.close()
  }
}
