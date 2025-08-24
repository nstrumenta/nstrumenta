import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { FirestoreAdapter, StorageAdapter } from '@nstrumenta/data-adapter';
import { Subscription } from 'rxjs';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.component.html',
  styleUrls: ['./repositories.component.scss'],
})
export class RepositoriesComponent implements OnInit, OnDestroy {
  displayedColumns = ['select', 'name', 'url', 'lastModified'];
  subscription: Subscription;
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private firestoreAdapter: FirestoreAdapter,
    private storageAdapter: StorageAdapter,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/repositories';
    this.subscription = this.firestoreAdapter
      .collection$<any>(this.dataPath)
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
    this.firestoreAdapter.updateDoc(this.dataPath + '/' + fileDocument.id, {
      name: fileDocument.name,
    });
    this.storageAdapter.updateMetadata(fileDocument.filePath, {
      contentDisposition: 'attachment; filename=' + fileDocument.name,
    });
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.firestoreAdapter.deleteDoc(this.dataPath + '/' + item.id);
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
        this.firestoreAdapter.addDoc(this.dataPath, result);
      }
    });
  }
}
