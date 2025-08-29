import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

@Component({
    selector: 'app-agents',
    templateUrl: './agents.component.html',
    styleUrls: ['./agents.component.scss'],
    standalone: false
})
export class AgentsComponent implements OnInit {
  displayedColumns = ['select', 'id', 'tag', 'status', 'createdAt'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
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
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
