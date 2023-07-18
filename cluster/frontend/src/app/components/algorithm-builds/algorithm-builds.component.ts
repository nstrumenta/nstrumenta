import { Component, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-algorithm-builds',
  templateUrl: './algorithm-builds.component.html',
  styleUrls: ['./algorithm-builds.component.scss'],
})
export class AlgorithmBuildsComponent implements OnInit {
  displayedColumns = ['select', 'name', 'committer', 'message', 'response', 'lastModified'];
  instanceCollection: AngularFirestoreCollection;
  selection = new SelectionModel<any>(true, []);
  dataSource: MatTableDataSource<any>;

  @Output() selectSandboxEvent = new EventEmitter();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const algorithmId = this.route.snapshot.paramMap.get('algorithmId');
    this.instanceCollection = this.afs.collection<any>(
      'projects/' + projectId + '/algorithms/' + algorithmId + '/builds/'
    );
    this.instanceCollection
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

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.storage.ref(item.filePath).delete();
      this.afs.doc(this.instanceCollection + '/' + item.key).delete();
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((item) => {
      console.log('downloading', item);
      fetch(item.url)
        .then((resp) => resp.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = item.key + '.js';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(() => alert('Could not download file.'));
    });
  }

  open(data): void {
    this.selectSandboxEvent.emit(data.url);
    // console.log(data);
    // this.sandbox.open(data.url, data.name);
    // let count = 0;
    // setInterval(() => {
    //   this.sandbox.send(data.url, (count++).toString());
    // }, 1000);
  }
}
