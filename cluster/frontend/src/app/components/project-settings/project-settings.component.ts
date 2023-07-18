import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { ProjectSettings } from 'src/app/models/projectSettings.model';
import { ServerService } from 'src/app/services/server.service';
import { ProjectService } from 'src/app/services/project.service';
import {
  AddProjectMemberDialogComponent,
  AddProjectMemberDialogResponse,
} from '../add-project-member-dialog/add-project-member-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  CreateKeyDialogComponent,
  CreateKeyDialogResponse,
} from '../create-key-dialog/create-key-dialog.component';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styles: [
    `
      .mat-column-keyId {
        flex: 0 0 60%;
      }
    `,
  ],
})
export class ProjectSettingsComponent implements OnInit, OnDestroy {
  membersDisplayedColumns = ['memberId', 'role', 'action'];
  membersDataSource: MatTableDataSource<any>;
  apiKeysDisplayedColumns = ['keyId', 'createdAt', 'lastUsed', 'action'];
  apiKeysDataSource: MatTableDataSource<any>;
  projectId: string;
  projectPath: string;
  projectSettings: ProjectSettings;
  subscriptions = new Array<Subscription>();

  constructor(
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private authService: AuthService,
    public dialog: MatDialog,
    private projectService: ProjectService,
    private serverService: ServerService
  ) { }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.projectPath = '/projects/' + this.route.snapshot.paramMap.get('projectId');
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        if (user) {
          this.subscriptions.push(
            this.afs
              .doc(this.projectPath)
              .valueChanges()
              .subscribe((doc: ProjectSettings) => {
                const memberTableData = Object.keys(doc.members).map((key) => {
                  return { memberId: key, role: doc.members[key] };
                });
                this.membersDataSource = new MatTableDataSource(memberTableData);

                const apiKeysData = Object.keys(doc.apiKeys ? doc.apiKeys : {})
                  .map((key) => {
                    return { keyId: key, createdAt: doc.apiKeys[key].createdAt };
                  })
                  .sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  });
                this.apiKeysDataSource = new MatTableDataSource(apiKeysData);

                this.projectSettings = doc;
              })
          );
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  rename(name) {
    console.log('rename', name);
    this.afs.doc(this.projectPath).set({ name: name }, { merge: true });
  }

  removeMember(memberId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        const members = this.projectSettings.members;
        delete members[memberId];
        this.afs.doc(this.projectPath).update({ members });
      }
    });
  }

  addProjectMember() {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent);

    dialogRef.afterClosed().subscribe((response: AddProjectMemberDialogResponse) => {
      if (response && response.memberId) {
        const members = this.projectSettings.members;
        members[response.memberId] = response.role;
        this.afs.doc(this.projectPath).update({ members });
      }
    });
  }

  createServiceAccount() {
    this.serverService.runServerTask('createServiceAccount', this.projectId, {}, (progress) => {
      console.log('task:' + progress);
    })
  }

  createApiKey() {
    const dialogRef = this.dialog.open(CreateKeyDialogComponent);
    dialogRef.afterClosed().subscribe((response: CreateKeyDialogResponse) => {
      if (response && response.keyId) {
        const apiKeys = this.projectSettings.apiKeys ? this.projectSettings.apiKeys : {};
        apiKeys[response.keyId] = { createdAt: response.createdAt };
        this.afs.doc(this.projectPath).update({ apiKeys });
      }
    });
  }
  revokeApiKey(keyId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        this.projectService.revokeApiKey(keyId).then((actionResponse) => {
          const apiKeys = this.projectSettings.apiKeys ? this.projectSettings.apiKeys : {};
          delete apiKeys[keyId];
          this.afs.doc(this.projectPath).update({ apiKeys });
          console.log('revokeApiKey response', actionResponse);
        });
      }
    });
  }
}
