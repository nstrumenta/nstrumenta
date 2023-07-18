import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { Action } from 'src/app/models/action.model';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-navbar-status',
  templateUrl: './navbar-status.component.html',
  styleUrls: ['./navbar-status.component.scss'],
})
export class NavbarStatusComponent implements OnInit, OnDestroy {
  public actions: Observable<Action[]>;
  public projectId: string;
  subscriptions = new Array<Subscription>();

  constructor(private afs: AngularFirestore, private projectService: ProjectService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.projectService.currentProject.subscribe((projectId) => {
        this.projectId = projectId;
        if (this.projectId) {
          const actionPath = '/projects/' + this.projectId + '/actions';
          this.actions = this.afs
            .collection<Action>(actionPath, (ref) => ref.orderBy('created', 'desc'))
            .valueChanges();
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
