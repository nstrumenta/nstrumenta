import { Component, ViewChild, OnInit, inject, DestroyRef, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@angular/fire/storage';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

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
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private storage = inject(Storage);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle repositories data changes
    effect(() => {
      const repositories = this.firebaseDataService.repositories();
      this.dataSource = new MatTableDataSource(repositories);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = '/projects/' + this.projectId + '/repositories';
    
    // Set project in Firebase service to trigger data loading
    if (this.projectId) {
      this.firebaseDataService.setProject(this.projectId);
    }
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
      this.firebaseDataService.deleteRepository(this.projectId, item.key);
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
        this.firebaseDataService.addRepository(this.projectId, result);
      }
    });
  }
}
