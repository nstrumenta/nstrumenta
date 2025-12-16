import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import { FirebaseDocument } from 'src/app/models/firebase.model';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
    selector: 'app-data-detail',
    template: `
    <ng-container>
      @if (isVideo) {
        <video controls width="100%" style="max-height: 80%" [src]="url"></video>
      }
      <a mat-button [href]="url">{{ (fileDoc | async)?.name }}</a>
      <mat-list>
        <mat-list-item>filePath: {{ (fileDoc | async)?.filePath }}</mat-list-item>
        <mat-list-item>size: {{ (fileDoc | async)?.size | fileSize }}</mat-list-item>
        <mat-list-item>lastModified: {{ (fileDoc | async)?.lastModified }}</mat-list-item>
        <mat-list-item>dirname: {{ (fileDoc | async)?.dirname }}</mat-list-item>
      </mat-list>
      @if (contents) {
        <div style="overflow-wrap: anywhere; width: 100% ; white-space: pre-wrap">
          {{ contents }}
        </div>
      }
    </ng-container>
    `,
    styles: [],
    imports: [MatButton, MatList, MatListItem, AsyncPipe, FileSizePipe]
})
export class DataDetailComponent implements OnInit {
  dataPath: string;
  fileDoc: Observable<FirebaseDocument>;
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

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataId = this.route.snapshot.paramMap.get('dataId');
    this.dataPath = `/projects/${this.projectId}/data/${this.dataId}`;
    
    // Use Firebase service to get the document
    this.fileDoc = this.firebaseDataService.getDocument(this.projectId, 'data', this.dataId);
    
    this.fileDoc.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((doc) => {
        console.log(doc);
        const filePath = doc.filePath as string;
        const fileName = doc.name as string;
        const fileSize = doc.size as number;
        
        if (!fileName || !filePath) {
          console.warn('Missing fileName or filePath in document', doc);
          return;
        }
        
        this.firebaseDataService.getDownloadUrl(filePath)
          .then(async (url) => {
            if (
              fileName.toLowerCase().endsWith('.mov') ||
              fileName.toLowerCase().endsWith('.mp4') ||
              fileName.toLowerCase().endsWith('.webm')
            ) {
              this.isVideo = true;
            } else {
              this.isVideo = false;
            }
            if (fileName.toLowerCase().endsWith('.json')) {
              if (fileSize < 1000000) {
                this.contents = JSON.stringify(await (await fetch(url)).json(), undefined, 4);
              } else if (fileSize < 100_000_000) {
                this.contents = await (await fetch(url)).text();
              } else {
                this.contents = 'large file, no preview available';
              }
            }
            if (
              fileName.toLowerCase().endsWith('.txt') ||
              fileName.toLowerCase().endsWith('.log')
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
