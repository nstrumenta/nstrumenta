import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FirestoreAdapter } from '@nstrumenta/data-adapter';
import { AuthService } from 'src/app/auth/auth.service';
import * as uuid from 'uuid';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-new-project-dialog',
  templateUrl: './new-project-dialog.component.html',
  styleUrls: ['./new-project-dialog.component.scss'],
})
export class NewProjectDialogComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  projectName: string;
  uid: string;

  constructor(
    private authService: AuthService,
    private firestoreAdapter: FirestoreAdapter,
    public dialogRef: MatDialogRef<NewProjectDialogComponent>
  ) {}

  async create(projectIdRaw: string): Promise<void> {
    const projectIdBase = encodeURIComponent(
      projectIdRaw
        .toLowerCase()
        .replace(/ +/g, '-')
        .replace(/[^a-z0-9 _-]+/gi, '-')
    );
    const { uid } = this.authService.user.value;

    //append random suffix string if project exists
    let confirmedUnique = false;
    let suffix = '';
    while (!confirmedUnique) {
      const doc = await firstValueFrom(
        this.firestoreAdapter.doc$(`projects/${projectIdBase}${suffix}`)
      );
      if (doc !== undefined) {
        console.log(`${projectIdBase}${suffix}`, 'exists');
        suffix = uuid.v4().substring(8, 13);
      } else {
        confirmedUnique = true;
      }
    }
    const projectId = `${projectIdBase}${suffix}`;

    this.firestoreAdapter.setDoc(`users/${uid}/projects/${projectId}`, {
      name: this.projectName,
    });
    console.log('writing new project: ' + projectId);
    const newProjectDocument: any = {};
    newProjectDocument.members = {};
    newProjectDocument.agentType = 'main';
    newProjectDocument.members[uid] = 'owner';
    newProjectDocument.name = this.projectName;

    this.firestoreAdapter.setDoc(`projects/${projectId}`, newProjectDocument);
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  ngOnInit() {}
}
