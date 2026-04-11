import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { Machine } from 'src/app/models/firebase.model';
import { VmService } from 'src/app/vm.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatIconButton, MatButton, MatFabButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenuItem } from '@angular/material/menu';

@Component({
    selector: 'app-machines',
    templateUrl: './machines.component.html',
    styleUrls: ['./machines.component.scss'],
    imports: [MatFormField, MatLabel, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, DatePipe]
})
export class MachinesComponent {
  displayedColumns = ['select', 'name', 'createdAt', 'status', 'serverStatus', 'downloadURL'];
  dataSource: MatTableDataSource<Machine>;
  selection = new SelectionModel<Machine>(true, []);
  get projectId() { return this.firebaseDataService.projectId(); }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);
  private vmService = inject(VmService);

  constructor() {
    effect(() => {
      const machines = this.firebaseDataService.machines();
      this.dataSource = new MatTableDataSource(machines);
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

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.vmService.deleteDeployedCloudAgent({ instanceId: item.name });
    });
    this.selection.clear();
  }

  createMachine() {
    this.vmService.deployCloudAgent();
  }
}
