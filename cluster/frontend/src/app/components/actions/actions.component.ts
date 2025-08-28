import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData, query, orderBy, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, updateMetadata } from '@angular/fire/storage';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
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
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/actions';
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        this.subscriptions.push(
          (() => {
            const actionsCollection = collection(this.firestore, this.dataPath);
            const orderedQuery = query(actionsCollection, orderBy('lastModified', 'desc'));
            return collectionData(orderedQuery, { idField: 'key' });
          })().subscribe((data: any[]) => {
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
    const docRef = doc(this.firestore, this.dataPath + '/' + fileDocument.key);
    setDoc(docRef, { name: fileDocument.name }, { merge: true });
    const storageRef = ref(this.storage, fileDocument.filePath);
    updateMetadata(storageRef, {
      contentDisposition: 'attachment; filename=' + fileDocument.name,
    });
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      const docRef = doc(this.firestore, this.dataPath + '/' + item.key);
      deleteDoc(docRef);
    });
    this.selection.clear();
  }
}
