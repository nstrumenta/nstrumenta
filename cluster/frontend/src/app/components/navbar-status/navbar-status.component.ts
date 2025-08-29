import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable, switchMap, of, map, combineLatest } from 'rxjs';
import { Action } from 'src/app/models/action.model';
import { ProjectService } from 'src/app/services/project.service';

@Component({
    selector: 'app-navbar-status',
    templateUrl: './navbar-status.component.html',
    styleUrls: ['./navbar-status.component.scss'],
    standalone: false
})
export class NavbarStatusComponent implements OnInit {
  public actions: Observable<Action[]>;
  public projectId: string;

  private firestore = inject(Firestore);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Create observable that filters based on current project without calling Firebase in reactive stream
    this.actions = this.projectService.currentProject.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((projectId) => {
        this.projectId = projectId;
        return projectId;
      }),
      switchMap((projectId) => {
        if (projectId) {
          // Create the Firebase observable here, within the injection context
          return this.getActionsForProject(projectId);
        } else {
          return of([]);
        }
      })
    );
  }

  private getActionsForProject(projectId: string): Observable<Action[]> {
    const actionPath = '/projects/' + projectId + '/actions';
    const actionsCollection = collection(this.firestore, actionPath);
    const orderedQuery = query(actionsCollection, orderBy('created', 'desc'));
    return collectionData(orderedQuery, { idField: 'id' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ) as Observable<Action[]>;
  }
}
