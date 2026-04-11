import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Agent } from 'src/app/models/firebase.model';

@Component({
    selector: 'app-agents',
    templateUrl: './agents.component.html',
    styleUrls: ['./agents.component.scss'],
    imports: [MatFormField, MatLabel, MatIcon, MatInput, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, RouterLink, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class AgentsComponent {
  displayedColumns = ['select', 'id', 'tag', 'status', 'createdAt'];
  dataSource: MatTableDataSource<Agent>;
  selection = new SelectionModel<Agent>(true, []);
  get projectId() { return this.firebaseDataService.projectId(); }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const agents = this.firebaseDataService.agents();
      this.dataSource = new MatTableDataSource(agents);
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
}
