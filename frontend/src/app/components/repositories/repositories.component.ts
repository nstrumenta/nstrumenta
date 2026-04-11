import { Component, ViewChild, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { RouterLink } from '@angular/router';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatIconButton, MatButton, MatFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { Repository } from 'src/app/models/firebase.model';

@Component({
    selector: 'app-repositories',
    templateUrl: './repositories.component.html',
    styleUrls: ['./repositories.component.scss'],
    imports: [MatFormField, MatLabel, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, RouterLink, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, DatePipe]
})
export class RepositoriesComponent {
  displayedColumns = ['select', 'name', 'url', 'lastModified'];
  dataSource: MatTableDataSource<Repository>;
  selection = new SelectionModel<Repository>(true, []);
  get projectId() { return this.firebaseDataService.projectId(); }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const repositories = this.firebaseDataService.repositories();
      this.dataSource = new MatTableDataSource(repositories);
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
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
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
      window.open(item.downloadURL as string);
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
