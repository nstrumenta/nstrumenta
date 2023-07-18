import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.component.html',
  styleUrls: ['./repositories.component.scss'],
})
export class RepositoriesComponent implements OnInit, OnDestroy {
  displayedColumns = ['select', 'name', 'url', 'lastModified'];
  itemsCollection: AngularFirestoreCollection;
  subscription: Subscription;
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/repositories';
    this.itemsCollection = this.afs.collection<any>(this.dataPath);
    this.subscription = this.itemsCollection
      .snapshotChanges()
      .pipe(
        map((items) => {
          return items.map((a) => {
            const data = a.payload.doc.data();
            const key = a.payload.doc.id;
            return { key: key, ...data };
          });
        })
      )
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.sort = this.sort;
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  renameFile(fileDocument) {
    console.log('renameFile', fileDocument.name);
    this.afs
      .doc(this.dataPath + '/' + fileDocument.key)
      .set({ name: fileDocument.name }, { merge: true });
    this.storage.ref(fileDocument.filePath).updateMetadata({
      contentDisposition: 'attachment; filename=' + fileDocument.name,
    });
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.afs.doc(this.dataPath + '/' + item.key).delete();
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((item) => {
      console.log('downloading', item);
      window.open(item.downloadURL);
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      data: {
        title: 'Add Repository',
        description: 'Enter your full github URL:\n e.g. https://github.com/example/example.git',
        item: {
          url: null,
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
