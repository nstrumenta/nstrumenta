import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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
    this.projectService.currentProject.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((projectId) => {
      this.projectId = projectId;
      if (this.projectId) {
        const actionPath = '/projects/' + this.projectId + '/actions';
        const actionsCollection = collection(this.firestore, actionPath);
        const orderedQuery = query(actionsCollection, orderBy('created', 'desc'));
        this.actions = collectionData(orderedQuery) as Observable<Action[]>;
      }
    });
  }
}
