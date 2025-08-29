import { Component, ViewChild, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionData, deleteDoc, doc, addDoc } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { map } from 'rxjs/operators';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';

@Component({
    selector: 'app-repositories',
    templateUrl: './repositories.component.html',
    styleUrls: ['./repositories.component.scss'],
    standalone: false
})
export class RepositoriesComponent implements OnInit {
  displayedColumns = ['select', 'name', 'url', 'lastModified'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/repositories';
    
    // Use AngularFire's collectionData observable instead of onSnapshot
    collectionData(collection(this.firestore, this.dataPath), { idField: 'key' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
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

  renameFile(fileDocument) {
    console.log('renameFile', fileDocument.name);
    // Note: Firestore update operation needs to be implemented
    console.warn('renameFile not yet implemented with modern Firestore');
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      deleteDoc(doc(this.firestore, this.dataPath + '/' + item.key));
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
        addDoc(collection(this.firestore, this.dataPath), result);
      }
    });
  }
}
