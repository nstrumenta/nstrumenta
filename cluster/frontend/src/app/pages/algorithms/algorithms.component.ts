import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Router, ActivatedRoute } from '@angular/router';
import { AddItemDialogComponent } from 'src/app/components/add-item-dialog/add-item-dialog.component';

@Component({
  selector: 'app-algorithms',
  templateUrl: './algorithms.component.html',
  styleUrls: ['./algorithms.component.scss'],
})
export class AlgorithmsComponent implements OnInit {
  private itemsCollection: AngularFirestoreCollection;

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  openDialog() {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      data: {
        title: 'Add Algorithm',
        item: { repository: null },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.dir(result);
      if (result) {
        this.itemsCollection.add(result);
      }
    });
  }

  ngOnInit() {
    this.itemsCollection = this.afs.collection(this.router.url);
  }
}
