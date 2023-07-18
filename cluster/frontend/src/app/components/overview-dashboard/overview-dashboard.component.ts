import { Component, OnInit } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ArchiveService } from '../../services/archive.service';
import { MatDialog } from '@angular/material/dialog';
import { CloneProjectDialogComponent } from './clone-project-dialog.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-overview-dashboard',
  templateUrl: './overview-dashboard.component.html',
  styleUrls: ['./overview-dashboard.component.scss'],
})
export class OverviewDashboardComponent implements OnInit {
  subscriptions = new Array<Subscription>();
  sandboxes: Observable<any[]>;
  userId: string;

  constructor(
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private archive: ArchiveService,
    public dialog: MatDialog,
    private authService: AuthService,
  ) {
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');

    this.sandboxes = this.afs
      .collection('projects/' + projectId + '/sandboxes/', (ref) =>
        ref.orderBy('lastModified', 'desc'),
      )
      .valueChanges()
      .pipe(
        map((items) =>
          items
            .filter((item) => (item as any).screenshot)
            .sort((a: any, b: any) => b.completed - a.completed),
        ),
      );

    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        if (user) {
          this.userId = user.uid;
        }
      }),
    );
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(
      CloneProjectDialogComponent,
      {
        width: '250px',
        data: { name },
      });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.duplicateProject(result);
      }
    });
  }

  archiveProject(): void {
    console.log('[overview-component] triggered archive of current project');
    this.archive.archiveCurrentProject();
  }

  duplicateProject(name: string): void {
    console.log('[overview-component] triggered duplicate of current project from (most recent) archive');
    this.archive.duplicateCurrentProject(name, this.userId);
  }
}
