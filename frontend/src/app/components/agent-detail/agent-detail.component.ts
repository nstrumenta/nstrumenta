import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, OnChanges, ViewChild, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { Action } from 'src/app/models/action.model';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { JsonPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-agents',
    templateUrl: './agent-detail.component.html',
    styleUrls: ['./agent-detail.component.scss'],
    imports: [MatFormField, MatLabel, MatIcon, MatInput, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, JsonPipe, DatePipe]
})
export class AgentDetailComponent implements OnChanges {
  @Input() agentId: string;

  displayedColumns = ['id', 'task', 'status', 'createdAt', 'data'];
  dataSource: MatTableDataSource<Action>;
  selection = new SelectionModel<Action>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const agentActions = this.firebaseDataService.agentActions();
      this.dataSource = new MatTableDataSource(agentActions);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnChanges() {
    if (this.agentId) {
      this.firebaseDataService.setAgent(this.agentId);
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
