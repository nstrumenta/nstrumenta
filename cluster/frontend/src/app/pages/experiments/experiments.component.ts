import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AddItemDialogComponent } from 'src/app/components/add-item-dialog/add-item-dialog.component';

@Component({
  selector: 'app-experiments',
  templateUrl: './experiments.component.html',
  styleUrls: ['./experiments.component.scss'],
})
export class ExperimentsComponent implements OnInit {
  private itemsCollection: AngularFirestoreCollection;

  constructor(public dialog: MatDialog, private afs: AngularFirestore, private router: Router) {}

  openDialog() {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      data: {
        title: 'Add Experiment',
        item: { name: null },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.dir(result);
      if (result) {
        this.itemsCollection.add(result);
      }
    });
  }

  select(e) {
    console.log('select', e);
  }

  ngOnInit() {
    this.itemsCollection = this.afs.collection(this.router.url);
  }
}
