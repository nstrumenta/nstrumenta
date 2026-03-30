import { Component, inject, effect, signal } from '@angular/core';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { AsyncPipe } from '@angular/common';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-navbar-project-select',
  templateUrl: './navbar-project-select.component.html',
  styleUrls: ['./navbar-project-select.component.scss'],
  imports: [MatMenu, MatMenuItem, RouterLink, MatButton, MatMenuTrigger, AsyncPipe]
})
export class NavbarProjectSelectComponent {
  public authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);

  userProjects = this.firebaseDataService.userProjects;
  projectSettings = this.firebaseDataService.projectSettings;
  currentProjectId = this.firebaseDataService.projectId;
}
