import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
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
  authService = inject(AuthService);
  router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  @Output() drawerToggleClick = new EventEmitter();
  downloadURL: Observable<string>;
  projectId: string;
  uploads = new Map<string, { name: string; progress: Observable<number> }>();

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  isDataRouteOrUploading() {
    return this.uploads.size > 0 || this.router.url.endsWith('/data');
  }

  chooseFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files: File[] = [];
    if (target.files) {
      files.push(...Array.from(target.files));
    }
    this.upload(files);
  }

  upload(_files: File[]): void {
    console.warn('Upload functionality temporarily disabled - needs migration to modern Firebase Storage API');
    // TODO: Migrate entire upload method to modern Firebase Storage
    // The upload functionality in this component needs to be completely rewritten
    // to use the modern Firebase Storage API instead of compat layer
  }
}
