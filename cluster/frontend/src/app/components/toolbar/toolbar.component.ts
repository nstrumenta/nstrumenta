import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';

import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UploadMetadata } from '@angular/fire/compat/storage/interfaces';

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
    private storage: AngularFireStorage,
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
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    files.forEach(async (file) => {
      let filePath = `projects/${this.projectId}/data/${file.name}`;
      let exists = undefined;
      try {
        await firstValueFrom(this.storage.ref(filePath).getDownloadURL());
        exists = true;
      } catch {
        exists = false;
      }
      if (exists) {
        if (!confirm(`${file.name} exists, overwrite?`)) {
          return;
        }
      }
      console.log(`uploading ${file.name}`);
      console.log(filePath);
      const fileRef = this.storage.ref(filePath);
      const metadata: UploadMetadata = {
        contentDisposition: `attachment; filename=${file.name}`,
      };
      if (file.name.endsWith('.html')) {
        metadata.contentType = 'text/html';
      }
      if (file.name.endsWith('.js')) {
        metadata.contentType = 'application/javascript';
      }
      if (file.name.endsWith('.json')) {
        metadata.contentType = 'application/json';
      }
      if (file.name.endsWith('.css')) {
        metadata.contentType = 'text/css';
      }
      if (file.name.endsWith('.png')) {
        metadata.contentType = 'image/png';
      }
      if (file.name.endsWith('.jpeg') || file.name.endsWith('.jpg')) {
        metadata.contentType = 'image/jpeg';
      }
      if (file.name.endsWith('.gif')) {
        metadata.contentType = 'image/gif';
      }
      if (file.type) {
        metadata.contentType = file.type;
      }
      metadata.customMetadata = {
        name: file.name,
        size: `${file.size}`,
      };
      const task = this.storage.upload(filePath, file, metadata);

      this.uploads.set(filePath, { name: file.name, progress: task.percentageChanges() });
      task
        .snapshotChanges()
        .pipe(
          finalize(async () => {
            this.downloadURL = fileRef.getDownloadURL();
            console.log(`finished upload ${file.name}`);
            this.uploads.delete(filePath);
          })
        )
        .subscribe();
    });
  }

  ngOnInit() {}
}
