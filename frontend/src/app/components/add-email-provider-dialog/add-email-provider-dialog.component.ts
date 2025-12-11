import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';

interface DialogData {
  description: string;
}

@Component({
    selector: 'app-add-email-provider-dialog',
    templateUrl: './add-email-provider-dialog.component.html',
    styleUrls: ['./add-email-provider-dialog.component.scss'],
    imports: [CdkScrollable, MatDialogContent, MatDialogActions, MatButton]
})
export class AddEmailProviderDialogComponent {
  private dialogRef = inject(MatDialogRef<boolean>);
  public data: DialogData = inject(MAT_DIALOG_DATA);

  close() {
    this.dialogRef.close()
  }
}
