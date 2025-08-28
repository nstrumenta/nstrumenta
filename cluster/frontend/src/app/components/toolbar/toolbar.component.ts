import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';

import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadMetadata } from '@angular/fire/storage';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    standalone: false
})
export class ToolbarComponent implements OnInit {
  @Output() drawerToggleClick = new EventEmitter();
  downloadURL: Observable<string>;
  projectId: string;
  uploads = new Map<string, { name: string; progress: Observable<number> }>();

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  constructor(
    private route: ActivatedRoute,
    private storage: Storage,
    public authService: AuthService,
    public router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  isDataRouteOrUploading() {
    return this.uploads.size > 0 || this.router.url.endsWith('/data');
  }

  chooseFiles(event) {
    const files: Array<File> = [];
    for (let i = 0; i < event.target.files.length; i++) {
      files.push(event.target.files[i]);
    }
    this.upload(files);
  }

  upload(files: Array<File>) {
    console.warn('Upload functionality temporarily disabled - needs migration to modern Firebase Storage API');
    // TODO: Migrate entire upload method to modern Firebase Storage
    // The upload functionality in this component needs to be completely rewritten
    // to use the modern Firebase Storage API instead of compat layer
  }

  ngOnInit() {}
}
