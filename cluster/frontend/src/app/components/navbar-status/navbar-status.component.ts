import { Component, OnDestroy, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, query, orderBy } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Action } from 'src/app/models/action.model';
import { ProjectService } from 'src/app/services/project.service';

@Component({
    selector: 'app-navbar-status',
    templateUrl: './navbar-status.component.html',
    styleUrls: ['./navbar-status.component.scss'],
    standalone: false
})
export class NavbarStatusComponent implements OnInit, OnDestroy {
  public actions: Observable<Action[]>;
  public projectId: string;
  subscriptions = new Array<Subscription>();

  constructor(private firestore: Firestore, private projectService: ProjectService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.projectService.currentProject.subscribe((projectId) => {
        this.projectId = projectId;
        if (this.projectId) {
          const actionPath = '/projects/' + this.projectId + '/actions';
          const actionsCollection = collection(this.firestore, actionPath);
          const orderedQuery = query(actionsCollection, orderBy('created', 'desc'));
          this.actions = collectionData(orderedQuery) as Observable<Action[]>;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
