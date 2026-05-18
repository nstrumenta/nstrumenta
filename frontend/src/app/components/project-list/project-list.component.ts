import { Component, inject, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth.service';
import { FirebaseDataService } from '../../services/firebase-data.service';
import { NewProjectDialogComponent } from '../new-project-dialog/new-project-dialog.component';
import { DatePipe } from '@angular/common';
import { MatFabButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Project } from '../../models/firebase.model';

// Reserved paths that cannot be used as org slugs (mirrors reserved-path.guard.ts)
const RESERVED_PATHS = new Set([
  'admin', 'settings', 'new', 'waitlist', 'login', 'signup',
  'api', 'mcp', 'oauth', 'health', 'config', 'assets', '_', 'projects', 'account'
]);

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, RouterLink, MatFabButton, MatIcon, DatePipe, MatFormField, MatLabel, MatInput]
})
export class ProjectListComponent {
  public dialog = inject(MatDialog);
  public authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private router = inject(Router);

  filterText = signal('');

  userProjects = this.firebaseDataService.userProjects;

  filteredProjects = computed(() => {
    const filter = this.filterText().toLowerCase();
    return this.userProjects()
      .filter((p: Project) => !filter || (p.name || p.id || '').toLowerCase().includes(filter))
      .sort((a: Project, b: Project) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0));
  });

  constructor() {}

  newProjectDialog() {
    this.dialog.open(NewProjectDialogComponent).afterClosed().subscribe(result => {
      if (result?.orgSlug && result?.slug) {
        this.firebaseDataService.refreshUserProjects();
        this.router.navigate(['/', result.orgSlug, result.slug, 'overview']).catch(console.error);
      }
    });
  }

  isRoutable(project: Project): boolean {
    return !!project.orgSlug && !!project.slug && !RESERVED_PATHS.has(project.orgSlug);
  }
}
