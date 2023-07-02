import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { Observable, Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-data-detail',
  template: `
    <ng-container>
      <video controls *ngIf="isVideo" width="100%" style="max-height: 80%" [src]="url"></video>
      <a mat-button [href]="url">{{ (fileDoc | async)?.name }}</a>
      <mat-list>
        <mat-list-item>dataId: {{ (fileDoc | async)?.dataId }}</mat-list-item>
        <mat-list-item>filePath: {{ (fileDoc | async)?.filePath }}</mat-list-item>
        <mat-list-item>lastModified: {{ (fileDoc | async)?.lastModified }}</mat-list-item>
      </mat-list>
      <div style="overflow-wrap: anywhere; width: 100%" *ngIf="contents">
        {{ contents }}
      </div>
    </ng-container>
  `,
  styles: [],
})
export class DataDetailComponent implements OnInit, OnDestroy {
  dataPath: string;
  fileDoc: Observable<any>;
  subscriptions = new Array<Subscription>();
  url: SafeResourceUrl;
  contents: string;
  isVideo: boolean;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.dataPath =
      '/projects/' +
      this.route.snapshot.paramMap.get('projectId') +
      '/data/' +
      this.route.snapshot.paramMap.get('dataId');

    this.fileDoc = this.afs.doc<any>(this.dataPath).valueChanges();
    this.subscriptions.push(
      this.fileDoc.subscribe((doc) => {
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
              this.contents = JSON.stringify(await (await fetch(url)).json());
            }
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          })
          .catch((error) => {
            console.error(error);
          });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
