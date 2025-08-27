import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
    selector: 'app-edit-dialog',
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss'],
    standalone: false
})
export class EditDialogComponent {
  newEmail: string;

  constructor(
    private afs: AngularFirestore,
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateEmail(): void {
    // this.afs.collection('hackers').doc(this.data.uid).update({ email: this.newEmail });
    this.dialogRef.close();
  }
}
