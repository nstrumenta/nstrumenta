import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';

@Component({
  selector: 'app-repository-jobs',
  templateUrl: './repository-jobs.component.html',
  styleUrls: ['./repository-jobs.component.scss'],
})
export class RepositoryJobsComponent implements OnInit, OnDestroy {
  displayedColumns = ['select', 'name', 'url', 'lastModified'];
  itemsCollection: AngularFirestoreCollection;
  subscription: Subscription;
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  projectId: string;
  repositoryId: string;
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    public dialog: MatDialog,
    private serverService: ServerService
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.repositoryId = this.route.snapshot.paramMap.get('repositoryId');
    this.dataPath = '/projects/' + this.projectId + '/repositories/' + this.repositoryId + '/jobs';
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

  build() {
    this.serverService
      .runServerTask(
        'buildFromGithub',
        this.projectId,
        {
          projectId: this.projectId,
          repositoryId: this.repositoryId,
        },
        (progressMessage) => {
          console.log(progressMessage);
        }
      )
      .then((result) => {
        console.log('build complete', result);
      });
  }
}
