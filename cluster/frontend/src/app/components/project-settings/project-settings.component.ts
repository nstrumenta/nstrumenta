import { Component, OnInit, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ProjectSettings } from 'src/app/models/projectSettings.model';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
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
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';

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
    imports: [MatList, MatListItem, MatButton, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class ProjectSettingsComponent implements OnInit {
  membersDisplayedColumns = ['memberId', 'role', 'action'];
  membersDataSource: MatTableDataSource<any>;
  apiKeysDisplayedColumns = ['keyId', 'createdAt', 'lastUsed', 'action'];
  apiKeysDataSource: MatTableDataSource<any>;
  projectId: string;
  projectPath: string;
  projectSettings: ProjectSettings;

  // Inject services using the new Angular 20 pattern
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);
  private serverService = inject(ServerService);
  private projectService = inject(ProjectService);

  constructor() {
    // Set up effect to handle project settings changes
    effect(() => {
      const settings = this.firebaseDataService.projectSettings();
      if (settings) {
        this.projectSettings = settings;
        
        // Transform members object to table data
        const memberTableData = Object.keys(settings.members || {}).map((key) => {
          return { memberId: key, role: settings.members[key] };
        });
        this.membersDataSource = new MatTableDataSource(memberTableData);

        // Transform apiKeys object to table data
        const apiKeysData = Object.keys(settings.apiKeys ? settings.apiKeys : {})
          .map((key) => {
            return { keyId: key, createdAt: settings.apiKeys[key].createdAt };
          })
          .sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        this.apiKeysDataSource = new MatTableDataSource(apiKeysData);
      }
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.projectPath = `/projects/${this.projectId}`;
    
    // Subscribe to user auth state and set project when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && this.projectId) {
        this.firebaseDataService.setProject(this.projectId);
      }
    });
  }

  async updateProjectName(name: string) {
    try {
      await this.firebaseDataService.updateProjectSettings(this.projectId, { name });
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  }

  removeMember(memberId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe(async (response) => {
      if (response) {
        const members = { ...this.projectSettings.members };
        delete members[memberId];
        await this.firebaseDataService.updateProjectSettings(this.projectId, { members });
      }
    });
  }

  addProjectMember() {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent);

    dialogRef.afterClosed().subscribe(async (response: AddProjectMemberDialogResponse) => {
      if (response && response.memberId) {
        const members = { ...this.projectSettings.members };
        members[response.memberId] = response.role;
        await this.firebaseDataService.updateProjectSettings(this.projectId, { members });
      }
    });
  }

  createApiKey() {
    const dialogRef = this.dialog.open(CreateKeyDialogComponent);
    dialogRef.afterClosed().subscribe(async (response: CreateKeyDialogResponse) => {
      if (response && response.keyId) {
        const apiKeys = this.projectSettings.apiKeys ? { ...this.projectSettings.apiKeys } : {};
        apiKeys[response.keyId] = { createdAt: response.createdAt };
        await this.firebaseDataService.updateProjectSettings(this.projectId, { apiKeys });
      }
    });
  }
  revokeApiKey(keyId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        this.projectService.revokeApiKey(keyId).then(async (actionResponse) => {
          const apiKeys = this.projectSettings.apiKeys ? { ...this.projectSettings.apiKeys } : {};
          delete apiKeys[keyId];
          await this.firebaseDataService.updateProjectSettings(this.projectId, { apiKeys });
          console.log('revokeApiKey response', actionResponse);
        });
      }
    });
  }
}
