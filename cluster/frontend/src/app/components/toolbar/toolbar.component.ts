import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { UploadService } from 'src/app/services/upload.service';
import { FolderNavigationService } from 'src/app/services/folder-navigation.service';
import { MatToolbar } from '@angular/material/toolbar';
import { AsyncPipe } from '@angular/common';
import { MatIconButton, MatButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { NavbarProjectSelectComponent } from '../navbar-project-select/navbar-project-select.component';
import { NavbarStatusComponent } from '../navbar-status/navbar-status.component';
import { NavbarVscodeComponent } from '../navbar-vscode/navbar-vscode.component';
import { NavbarAccountComponent } from '../navbar-account/navbar-account.component';
import { UploadProgressComponent } from '../../upload-progress/upload-progress.component';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    imports: [MatToolbar, MatIconButton, MatIcon, NavbarTitleComponent, NavbarProjectSelectComponent, NavbarStatusComponent, MatButton, RouterLink, NavbarVscodeComponent, NavbarAccountComponent, MatFabButton, UploadProgressComponent, AsyncPipe]
})
export class ToolbarComponent {
  private route = inject(ActivatedRoute);
  private firebaseDataService = inject(FirebaseDataService);
  uploadService = inject(UploadService);
  private folderNav = inject(FolderNavigationService);
  authService = inject(AuthService);
  router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  @Output() drawerToggleClick = new EventEmitter();
  downloadURL: Observable<string>;
  projectId: string;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  isDataRouteOrUploading() {
    return this.uploadService.hasActiveUploads() || this.router.url.includes('/data');
  }

  chooseFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files: File[] = [];
    if (target.files) {
      files.push(...Array.from(target.files));
    }
    this.upload(files);
  }

  async upload(files: File[], folder?: string): Promise<void> {
    const projectId = this.firebaseDataService.projectId();
    if (!projectId || !files?.length) return;

    const uploadFolder = folder || this.folderNav.currentFolder();

    for (const file of files) {
      try {
        await this.uploadService.uploadFile(projectId, file, uploadFolder);
      } catch (error) {
        console.error(`Failed to initialize upload for ${file.name}:`, error);
      }
    }
  }
}
