import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-agents',
    templateUrl: './agent-detail.component.html',
    styleUrls: ['./agent-detail.component.scss'],
    standalone: false
})
export class AgentDetailComponent implements OnInit {
  displayedColumns = ['id', 'task', 'status', 'createdAt', 'data'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const agentId = this.route.snapshot.paramMap.get('agentId');
    this.dataPath = `/projects/${projectId}/agents/${agentId}/actions`;
    console.log(this.dataPath);
    
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user) {
        // Use AngularFire's collectionData observable instead of onSnapshot
        collectionData(collection(this.firestore, this.dataPath), { idField: 'id' }).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe((data) => {
          this.dataSource = new MatTableDataSource(data);
          this.dataSource.sort = this.sort;
        });
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
