import { Component, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { map } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-algorithm-table',
  templateUrl: './algorithm-table.component.html',
  styleUrls: ['./algorithm-table.component.scss'],
})
export class AlgorithmTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'repository', 'lastModified'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  private projectId: string;
  private algorithmPath: string;

  @Output() selectSandboxEvent = new EventEmitter();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private serverService: ServerService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.algorithmPath = 'projects/' + this.projectId + '/algorithms';
    this.afs
      .collection<any>('projects/' + this.projectId + '/algorithms')
      .snapshotChanges()
      .pipe(
        map((items) => {
          return items.map((a) => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      )
      .subscribe((data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.sort = this.sort;
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.storage.ref(item.filePath).delete();
      this.afs.doc(this.algorithmPath + '/' + item.key).delete();
    });
    this.selection.clear();
  }

  onBuild(document) {
    this.serverService
      .runServerTask(
        'gitToken',
        this.projectId,
        { algorithmDoc: document, algorithmPath: this.algorithmPath },
        (progress) => {
          console.log('task:' + progress);
        }
      )
      .then((gitToken) => {
        console.log(gitToken);
      });
  }

  open(data): void {
    this.selectSandboxEvent.emit(data.url);
  }
}
