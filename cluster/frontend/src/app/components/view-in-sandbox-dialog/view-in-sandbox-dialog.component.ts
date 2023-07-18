import { Component, OnInit, Inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export interface Sandbox {
  url: string;
  name: string;
}

@Component({
  selector: 'app-view-in-sandbox-dialog',
  templateUrl: './view-in-sandbox-dialog.component.html',
  styleUrls: ['./view-in-sandbox-dialog.component.scss'],
})
export class ViewInSandboxDialogComponent implements OnInit {
  sandboxes: Observable<Sandbox[]>;
  path = '';
  selected = '';

  constructor(
    private afs: AngularFirestore,
    public dialogRef: MatDialogRef<ViewInSandboxDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  open(): void {
    window.open(this.selected + '?' + 'data=' + this.data.downloadURL, 'tab');
    console.log('open ' + this.selected);
    this.dialogRef.close();
  }

  ngOnInit() {
    this.path = '/projects/' + this.data.projectId + '/sandboxes';
    console.log(this.path);
    this.sandboxes = this.afs.collection<Sandbox>(this.path).valueChanges();
  }
}
