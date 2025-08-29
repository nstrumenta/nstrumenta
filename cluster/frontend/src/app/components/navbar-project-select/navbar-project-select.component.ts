import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-navbar-project-select',
    templateUrl: './navbar-project-select.component.html',
    styleUrls: ['./navbar-project-select.component.scss'],
    standalone: false
})
export class NavbarProjectSelectComponent implements OnInit {
  public authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  // Expose signals for template
  userProjects = this.firebaseDataService.userProjects;
  projectSettings = this.firebaseDataService.projectSettings;
  currentProjectId = signal<string>('');

  constructor() {
    // Use effect to watch for project settings changes and update user projects
    effect(() => {
      const projectId = this.currentProjectId();
      const settings = this.projectSettings();
      
      if (projectId && settings) {
        this.firebaseDataService.updateUserProject(projectId, settings);
      }
    });
  }

  ngOnInit() {
    // Watch route parameters for project changes
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      const projectId = paramMap.get('projectId');
      if (projectId) {
        this.currentProjectId.set(projectId);
        this.firebaseDataService.setProject(projectId);
      }
    });
  }
}
