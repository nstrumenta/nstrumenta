import { Component, Signal, computed, effect, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';
import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import { FirebaseDocument } from 'src/app/models/firebase.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
    selector: 'app-data-detail',
    template: `
    <ng-container>
      @if (isVideo()) {
        <video controls width="100%" style="max-height: 80%" [src]="url()"></video>
      }
      <a mat-button [href]="url()">{{ (fileDoc | async)?.name }}</a>
      <mat-list>
        <mat-list-item>filePath: {{ (fileDoc | async)?.filePath }}</mat-list-item>
        <mat-list-item>size: {{ (fileDoc | async)?.size | fileSize }}</mat-list-item>
        <mat-list-item>lastModified: {{ (fileDoc | async)?.lastModified }}</mat-list-item>
        <mat-list-item>dirname: {{ (fileDoc | async)?.dirname }}</mat-list-item>
      </mat-list>
      @if (contents()) {
        <div style="overflow-wrap: anywhere; width: 100% ; white-space: pre-wrap">
          {{ contents() }}
        </div>
      }
    </ng-container>
    `,
    styles: [],
    imports: [MatButton, MatList, MatListItem, AsyncPipe, FileSizePipe]
})
export class DataDetailComponent {
  dataId = input.required<string>();

  private firebaseDataService = inject(FirebaseDataService);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  url = signal<SafeResourceUrl | null>(null);
  contents = signal<string | null>(null);
  isVideo = signal(false);

  fileDoc = toObservable(computed(() => {
    const id = this.dataId();
    const projectId = this.firebaseDataService.projectId();
    return { id, projectId };
  })).pipe(
    switchMap(({ id, projectId }) =>
      this.firebaseDataService.getDocument(projectId, 'data', id)
    )
  );

  constructor() {
    effect((cleanup) => {
      const id = this.dataId();
      const projectId = this.firebaseDataService.projectId();
      if (!id || !projectId) return;

      this.url.set(null);
      this.contents.set(null);
      this.isVideo.set(false);

      const sub = this.firebaseDataService.getDocument(projectId, 'data', id).subscribe(async (doc) => {
        if (!doc) return;
        const filePath = doc.filePath as string;
        const fileName = doc.name as string;
        const fileSize = doc.size as number;
        if (!fileName || !filePath) return;

        try {
          const url = await this.apiService.getDownloadUrl(filePath, projectId);
          this.isVideo.set(
            fileName.toLowerCase().endsWith('.mov') ||
            fileName.toLowerCase().endsWith('.mp4') ||
            fileName.toLowerCase().endsWith('.webm')
          );
          if (fileName.toLowerCase().endsWith('.json')) {
            if (fileSize < 1_000_000) {
              this.contents.set(JSON.stringify(await (await fetch(url)).json(), undefined, 4));
            } else if (fileSize < 100_000_000) {
              this.contents.set(await (await fetch(url)).text());
            } else {
              this.contents.set('large file, no preview available');
            }
          } else if (fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.log')) {
            this.contents.set(await (await fetch(url)).text());
          }
          this.url.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        } catch (error) {
          console.error(error);
        }
      });

      cleanup(() => sub.unsubscribe());
    });
  }
}
