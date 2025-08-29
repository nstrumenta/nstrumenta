import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { Action } from 'src/app/models/action.model';

// Extend Action to include Firebase document key
interface ActionWithKey extends Action {
  key: string;
}

@Component({
    selector: 'app-agents',
    templateUrl: './agent-detail.component.html',
    styleUrls: ['./agent-detail.component.scss'],
    standalone: false
})
export class AgentDetailComponent implements OnInit {
  displayedColumns = ['id', 'task', 'status', 'createdAt', 'data'];
  dataSource: MatTableDataSource<ActionWithKey>;
  selection = new SelectionModel<ActionWithKey>(true, []);
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const agentId = this.route.snapshot.paramMap.get('agentId');
    this.dataPath = `/projects/${projectId}/agents/${agentId}/actions`;
    console.log(this.dataPath);
    
    // Set up effect to handle agent actions data changes  
    effect(() => {
      const agentActions = this.firebaseDataService.agentActions();
      this.dataSource = new MatTableDataSource(agentActions);
      this.dataSource.sort = this.sort;
    });
    
    // Subscribe to user auth state and set project and agent when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && projectId && agentId) {
        this.firebaseDataService.setProject(projectId);
        this.firebaseDataService.setAgent(agentId);
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
