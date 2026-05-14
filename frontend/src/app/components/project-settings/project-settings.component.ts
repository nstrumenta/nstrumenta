import { Component, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ProjectSettings } from 'src/app/models/projectSettings.model';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ProjectService } from 'src/app/services/project.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CreateKeyDialogComponent } from '../create-key-dialog/create-key-dialog.component';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { ProjectRoles } from 'src/app/models/projectSettings.model';
import { AddProjectMemberDialogComponent, AddProjectMemberDialogResponse } from '../add-project-member-dialog/add-project-member-dialog.component';
import { AuthService } from 'src/app/auth/auth.service';

interface MemberEntry {
  memberId: string;
  role: ProjectRoles;
}

interface ApiKeyEntry {
  keyId: string;
  createdAt: string;
  lastUsed?: number;
}

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
export class ProjectSettingsComponent {
  membersDisplayedColumns = ['memberId', 'role', 'action'];
  membersDataSource: MatTableDataSource<MemberEntry>;
  apiKeysDisplayedColumns = ['keyId', 'createdAt', 'lastUsed', 'action'];
  apiKeysDataSource: MatTableDataSource<ApiKeyEntry>;
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  get projectId() { return this.firebaseDataService.projectId(); }
  projectPath: string;
  projectSettings: ProjectSettings;

  constructor() {
    effect(() => {
      const settings = this.firebaseDataService.projectSettings();
      this.projectPath = `/projects/${this.projectId}`;
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
            return { 
              keyId: key, 
              createdAt: settings.apiKeys[key].createdAt,
              lastUsed: settings.apiKeys[key].lastUsed
            };
          })
          .sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        this.apiKeysDataSource = new MatTableDataSource(apiKeysData);
      }
    });
  }

  createApiKey() {
    this.dialog.open(CreateKeyDialogComponent);
  }
  revokeApiKey(keyId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        this.projectService.revokeApiKey(keyId);
      }
    });
  }

  inviteMember() {
    const dialogRef = this.dialog.open(AddProjectMemberDialogComponent);
    dialogRef.afterClosed().subscribe((response: AddProjectMemberDialogResponse | undefined) => {
      if (!response?.email) {
        return;
      }
      this.projectService.inviteProjectMember({
        email: response.email,
        role: response.role,
      }).catch(console.error);
    });
  }

  private get currentUserId(): string {
    return this.authService.currentUser()?.uid || '';
  }

  private get currentUserProjectRole(): ProjectRoles | null {
    return this.projectSettings?.members?.[this.currentUserId] || null;
  }

  canManageMembers(): boolean {
    return this.currentUserProjectRole === 'owner' || this.currentUserProjectRole === 'admin';
  }

  canRemoveMember(member: MemberEntry): boolean {
    if (!this.canManageMembers()) return false;
    if (member.memberId === this.currentUserId) return false;
    if (this.currentUserProjectRole === 'admin' && member.role === 'owner') return false;
    return true;
  }

  canSetRole(member: MemberEntry, nextRole: ProjectRoles): boolean {
    if (!this.canManageMembers()) return false;
    if (member.role === nextRole) return false;
    if (member.memberId === this.currentUserId) return false;
    if (this.currentUserProjectRole === 'admin' && (member.role === 'owner' || nextRole === 'owner')) {
      return false;
    }
    return true;
  }

  setMemberRole(member: MemberEntry, role: ProjectRoles) {
    if (!this.canSetRole(member, role)) return;
    this.projectService.updateProjectMemberRole({ memberId: member.memberId, role }).catch(console.error);
  }

  removeMember(member: MemberEntry) {
    if (!this.canRemoveMember(member)) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe((response) => {
      if (response) {
        this.projectService.removeProjectMember(member.memberId).catch(console.error);
      }
    });
  }
}
