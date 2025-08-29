import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { FirebaseDataService } from '../../services/firebase-data.service';
import { NewProjectDialogComponent } from '../new-project-dialog/new-project-dialog.component';

export interface Item {
  id: string;
  modified: number;
}

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    standalone: false
})
export class ProjectListComponent implements OnInit {
  displayedColumns = ['id', 'lastOpened'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  breakpoint: Number;

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
      const items = userProjects.map((item: any) => {
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

  ngOnInit() {
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
    const dialogRef = this.dialog.open(NewProjectDialogComponent);
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
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
