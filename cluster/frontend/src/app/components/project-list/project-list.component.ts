import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { AuthService } from '../../auth/auth.service';
import { FirebaseDataService } from '../../services/firebase-data.service';
import { NewProjectDialogComponent } from '../new-project-dialog/new-project-dialog.component';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatFabButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

// Interface for project data
interface Project {
  id: string;
  lastOpened: number;
  [key: string]: unknown; // Allow for additional properties
}

export interface Item {
  id: string;
  modified: number;
}

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    imports: [MatFormField, MatInput, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatButton, RouterLink, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, MatIcon, AsyncPipe, DatePipe]
})
export class ProjectListComponent implements OnInit {
  displayedColumns = ['id', 'lastOpened'];
  dataSource: MatTableDataSource<Project>;
  selection = new SelectionModel<Project>(true, []);
  breakpoint: number;

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  public dialog = inject(MatDialog);
  public authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Set up effect to handle user projects data changes
    effect(() => {
      const userProjects = this.firebaseDataService.userProjects();
      const items = userProjects.map((item: Project) => {
        return { key: item.id, id: item.id, ...item };
      });
      this.dataSource = new MatTableDataSource(items);
      this.dataSource.sort = this.sort;
    });
  }

  computeBreakpoint() {
    const ret = Math.max(1, Math.min(4, Math.ceil(window.innerWidth / 400)));
    return ret;
  }

  ngOnInit(): void {
    this.breakpoint = this.computeBreakpoint();
    
    // Subscribe to user auth state and set user when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user) {
        this.firebaseDataService.setUser(user.uid);
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  newProjectDialog() {
    this.dialog.open(NewProjectDialogComponent);
  }

  onResize() {
    this.breakpoint = this.computeBreakpoint();
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
