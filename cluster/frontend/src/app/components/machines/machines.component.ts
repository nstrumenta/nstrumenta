import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

// Interface for machine data
interface Machine {
  key: string;
  name: string;
  createdAt: number;
  status: string;
  serverStatus: string;
  downloadURL: string;
}
import { VmService } from 'src/app/vm.service';
import { MatFormField } from '@angular/material/form-field';
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
    imports: [MatFormField, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, DatePipe]
})
export class MachinesComponent implements OnInit {
  displayedColumns = ['select', 'name', 'createdAt', 'status', 'serverStatus', 'downloadURL'];
  dataSource: MatTableDataSource<Machine>;
  selection = new SelectionModel<Machine>(true, []);
  dataPath: string;
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);
  private vmService = inject(VmService);

  constructor() {
    // Set up effect to handle machines data changes
    effect(() => {
      const machines = this.firebaseDataService.machines();
      this.dataSource = new MatTableDataSource(machines);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = '/projects/' + this.projectId + '/machines';

    // Subscribe to user auth state and set project when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && this.projectId) {
        this.firebaseDataService.setProject(this.projectId);
      }
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
