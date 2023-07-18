import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AddItemDialogComponent } from 'src/app/components/add-item-dialog/add-item-dialog.component';

@Component({
  selector: 'app-sandboxes',
  templateUrl: './sandboxes.component.html',
  styleUrls: ['./sandboxes.component.scss'],
})
export class SandboxesComponent implements OnInit {
  selectedSandbox = '';
  itemsCollection: AngularFirestoreCollection;

  constructor(private dialog: MatDialog, private afs: AngularFirestore, private router: Router) {}

  ngOnInit() {
    this.itemsCollection = this.afs.collection(this.router.url);
  }

  openDialog() {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      data: {
        title: 'Add Sandbox',
        item: {
          repository: null,
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.dir(result);
      if (result) {
        result.lastModified = Date.now();
        this.itemsCollection.add(result);
      }
    });
  }
}
