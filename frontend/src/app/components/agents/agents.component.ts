import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { Agent } from 'src/app/models/firebase.model';

@Component({
    selector: 'app-agents',
    templateUrl: './agents.component.html',
    styleUrls: ['./agents.component.scss'],
    imports: [MatFormField, MatInput, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, RouterLink, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class AgentsComponent implements OnInit {
  displayedColumns = ['select', 'id', 'tag', 'status', 'createdAt'];
  dataSource: MatTableDataSource<Agent>;
  selection = new SelectionModel<Agent>(true, []);
  dataPath: string;
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle agents data changes
    effect(() => {
      const agents = this.firebaseDataService.agents();
      this.dataSource = new MatTableDataSource(agents);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = `/projects/${this.projectId}/agents`;
    
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
}
