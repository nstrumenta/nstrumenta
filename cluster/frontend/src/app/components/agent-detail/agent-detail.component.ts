import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-agents',
    templateUrl: './agent-detail.component.html',
    styleUrls: ['./agent-detail.component.scss'],
    standalone: false
})
export class AgentDetailComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'task', 'status', 'createdAt', 'data'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  subscriptions = new Array<Subscription>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const agentId = this.route.snapshot.paramMap.get('agentId');
    this.dataPath = `/projects/${projectId}/agents/${agentId}/actions`;
    console.log(this.dataPath);
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        this.subscriptions.push(
          this.afs
            .collection<any>(this.dataPath)
            .snapshotChanges()
            .pipe(
              map((items) => {
                return items.map((a) => {
                  const data = a.payload.doc.data();
                  const id = a.payload.doc.id;
                  return { id, ...data };
                });
              })
            )
            .subscribe((data) => {
              this.dataSource = new MatTableDataSource(data);
              this.dataSource.sort = this.sort;
            })
        );
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
