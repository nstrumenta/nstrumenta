import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';

import { AngularFirestore } from '@angular/fire/compat/firestore';

import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-actions',
    templateUrl: './actions.component.html',
    styleUrls: ['./actions.component.scss'],
    standalone: false
})
export class ActionsComponent implements OnInit, OnDestroy {
  displayedColumns = ['task', 'status', 'lastModified', 'error'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  subscriptions = new Array<Subscription>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/actions';
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        this.subscriptions.push(
          this.afs
            .collection<any>(this.dataPath)
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
            })
        );
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
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
}
