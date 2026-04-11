import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, Output, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { UploadService } from 'src/app/services/upload.service';
import { FolderNavigationService } from 'src/app/services/folder-navigation.service';
import { ThemeService } from 'src/app/services/theme.service';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
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
    imports: [MatToolbar, MatIconButton, MatIcon, MatDivider, NavbarTitleComponent, NavbarProjectSelectComponent, NavbarStatusComponent, NavbarVscodeComponent, NavbarAccountComponent, MatFabButton, UploadProgressComponent]
})
export class ToolbarComponent {
  private firebaseDataService = inject(FirebaseDataService);
  uploadService = inject(UploadService);
  private folderNav = inject(FolderNavigationService);
  authService = inject(AuthService);
  router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  @Output() drawerToggleClick = new EventEmitter();
  projectContext = input(false);
  themeService = inject(ThemeService);

  isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: false }
  );

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
