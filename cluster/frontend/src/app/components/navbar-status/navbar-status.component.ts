import { Component, OnInit, inject, DestroyRef, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Action } from 'src/app/models/action.model';
import { ProjectService } from 'src/app/services/project.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

@Component({
    selector: 'app-navbar-status',
    templateUrl: './navbar-status.component.html',
    styleUrls: ['./navbar-status.component.scss'],
    standalone: false
})
export class NavbarStatusComponent implements OnInit {
  public projectId: string;

  private projectService = inject(ProjectService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);

  // Use computed signal for actions (already sorted by Firebase service)
  public actions = computed(() => {
    return this.firebaseDataService.actions();
  });

  constructor() {
    // Subscribe to project changes and update Firebase service
    this.projectService.currentProject.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((projectId) => {
      this.projectId = projectId;
      if (projectId) {
        this.firebaseDataService.setProject(projectId);
      }
    });
  }

  ngOnInit() {
    // Component initialization - the effect in constructor handles the reactive logic
  }
}
