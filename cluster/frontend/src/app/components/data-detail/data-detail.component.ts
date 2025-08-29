import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { Observable } from 'rxjs';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

@Component({
    selector: 'app-data-detail',
    template: `
    <ng-container>
      <video controls *ngIf="isVideo" width="100%" style="max-height: 80%" [src]="url"></video>
      <a mat-button [href]="url">{{ (fileDoc | async)?.name }}</a>
      <mat-list>
      <mat-list-item>filePath: {{ (fileDoc | async)?.filePath }}</mat-list-item>
      <mat-list-item>size: {{ (fileDoc | async)?.size | fileSize }}</mat-list-item>
      <mat-list-item>lastModified: {{ (fileDoc | async)?.lastModified }}</mat-list-item>
        <mat-list-item>dirname: {{ (fileDoc | async)?.dirname }}</mat-list-item>
      </mat-list>
      <div style="overflow-wrap: anywhere; width: 100% ; white-space: pre-wrap" *ngIf="contents">
        {{ contents }}
      </div>
    </ng-container>
  `,
    styles: [],
    standalone: false
})
export class DataDetailComponent implements OnInit {
  dataPath: string;
  fileDoc: Observable<any>;
  url: SafeResourceUrl;
  contents: string;
  isVideo: boolean;
  projectId: string;
  dataId: string;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private firebaseDataService = inject(FirebaseDataService);
  public sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataId = this.route.snapshot.paramMap.get('dataId');
    this.dataPath = `/projects/${this.projectId}/data/${this.dataId}`;
    
    // Use Firebase service to get the document
    this.fileDoc = this.firebaseDataService.getDocument(this.projectId, 'data', this.dataId);
    
    this.fileDoc.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((doc) => {
        console.log(doc);
        const storage = getStorage();
        getDownloadURL(ref(storage, doc.filePath))
          .then(async (url) => {
            if (
              doc.name.toLowerCase().endsWith('.mov') ||
              doc.name.toLowerCase().endsWith('.mp4') ||
              doc.name.toLowerCase().endsWith('.webm')
            ) {
              this.isVideo = true;
            } else {
              this.isVideo = false;
            }
            if (doc.name.toLowerCase().endsWith('.json')) {
              if (doc.size < 1000000) {
                this.contents = JSON.stringify(await (await fetch(url)).json(), undefined, 4);
              } else if (doc.size < 100_000_000) {
                this.contents = await (await fetch(url)).text();
              } else {
                this.contents = 'large file, no preview available';
              }
            }
            if (
              doc.name.toLowerCase().endsWith('.txt') ||
              doc.name.toLowerCase().endsWith('.log')
            ) {
              this.contents = await (await fetch(url)).text();
            }
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }
}
