import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenuItem } from '@angular/material/menu';
import { Module } from 'src/app/models/firebase.model';

@Component({
    selector: 'app-modules',
    templateUrl: './modules.component.html',
    styleUrls: ['./modules.component.scss'],
    imports: [MatFormField, MatLabel, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class ModulesComponent {
  displayedColumns = ['select', 'id', 'url', 'modified'];
  dataSource: MatTableDataSource<Module>;
  selection = new SelectionModel<Module>(true, []);
  get projectId() { return this.firebaseDataService.projectId(); }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private firebaseDataService = inject(FirebaseDataService);
  private apiService = inject(ApiService);
  public dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const modules = this.firebaseDataService.modules();
      this.dataSource = new MatTableDataSource(modules);
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

  deleteSelected() {
    const projectId = this.firebaseDataService.projectId();
    this.selection.selected.forEach((item) => {
      this.apiService.deleteFile(item.filePath as string, item.id as string, projectId).catch(console.error);
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }

  download(fileDocument) {
    const projectId = this.firebaseDataService.projectId();
    this.apiService.getDownloadUrl(fileDocument.filePath, projectId)
      .then((url) => {
        window.open(url);
      })
      .catch(console.error);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }
}
