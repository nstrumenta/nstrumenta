import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { StorageAdapter } from '@nstrumenta/data-adapter';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
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
    private storageAdapter: StorageAdapter,
    public authService: AuthService,
    public router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  isDataRouteOrUploading() {
    return this.router.url.endsWith('/data');
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
      let exists = false;
      try {
        await this.storageAdapter.getDownloadURL(filePath);
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
      const metadata = {
        contentDisposition: `attachment; filename=${file.name}`,
        contentType: undefined,
        customMetadata: {
          name: file.name,
          size: `${file.size}`,
        },
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
      await this.storageAdapter.upload(filePath, file, metadata);
      console.log(`finished upload ${file.name}`);
    });
  }

  ngOnInit() {}
}
