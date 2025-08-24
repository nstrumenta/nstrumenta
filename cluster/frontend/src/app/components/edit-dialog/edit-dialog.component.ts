import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirestoreAdapter } from '@nstrumenta/data-adapter';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
})
export class EditDialogComponent {
  newEmail: string;

  constructor(
    private firestoreAdapter: FirestoreAdapter,
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateEmail(): void {
    // this.firestoreAdapter.updateDoc(`hackers/${this.data.uid}`, { email: this.newEmail });
    this.dialogRef.close();
  }
}
