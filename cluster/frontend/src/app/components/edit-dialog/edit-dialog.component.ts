import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-edit-dialog',
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss'],
    imports: [MatFormField, MatInput, FormsModule, MatButton]
})
export class EditDialogComponent {
  dialogRef = inject<MatDialogRef<EditDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);

  newEmail: string;

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateEmail(): void {
    this.dialogRef.close();
  }
}
