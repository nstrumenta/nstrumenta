import { Component, OnDestroy, OnInit } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc } from '@angular/fire/firestore';
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
    standalone: false
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
    private firestore: Firestore,
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
          const projectDoc = doc(this.firestore, this.projectPath);
          this.subscriptions.push(
            docData(projectDoc).subscribe((doc: ProjectSettings) => {
              const memberTableData = Object.keys(doc.members || {}).map((key) => {
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

  async updateProjectName(name: string) {
    try {
      const projectDoc = doc(this.firestore, this.projectPath);
      await updateDoc(projectDoc, { name });
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  }

  removeMember(memberId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe(async (response) => {
      if (response) {
        const members = this.projectSettings.members;
        delete members[memberId];
        const projectDoc = doc(this.firestore, this.projectPath);
        await updateDoc(projectDoc, { members });
      }
    });
  }

  addProjectMember() {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent);

    dialogRef.afterClosed().subscribe(async (response: AddProjectMemberDialogResponse) => {
      if (response && response.memberId) {
        const members = this.projectSettings.members;
        members[response.memberId] = response.role;
        const projectDoc = doc(this.firestore, this.projectPath);
        await updateDoc(projectDoc, { members });
      }
    });
  }

  createApiKey() {
    const dialogRef = this.dialog.open(CreateKeyDialogComponent);
    dialogRef.afterClosed().subscribe(async (response: CreateKeyDialogResponse) => {
      if (response && response.keyId) {
        const apiKeys = this.projectSettings.apiKeys ? this.projectSettings.apiKeys : {};
        apiKeys[response.keyId] = { createdAt: response.createdAt };
        const projectDoc = doc(this.firestore, this.projectPath);
        await updateDoc(projectDoc, { apiKeys });
      }
    });
  }
  revokeApiKey(keyId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        this.projectService.revokeApiKey(keyId).then(async (actionResponse) => {
          const apiKeys = this.projectSettings.apiKeys ? this.projectSettings.apiKeys : {};
          delete apiKeys[keyId];
          const projectDoc = doc(this.firestore, this.projectPath);
          await updateDoc(projectDoc, { apiKeys });
          console.log('revokeApiKey response', actionResponse);
        });
      }
    });
  }
}
