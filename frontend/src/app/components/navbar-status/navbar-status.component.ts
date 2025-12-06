import { Component, inject, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from 'src/app/services/project.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { DatePipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-navbar-status',
    templateUrl: './navbar-status.component.html',
    styleUrls: ['./navbar-status.component.scss'],
    imports: [MatProgressSpinner, DatePipe]
})
export class NavbarStatusComponent {
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
}
