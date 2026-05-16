import { Component, inject, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ProjectSettings } from 'src/app/models/projectSettings.model';
import { FirebaseDataService, ProjectInvitationRecord } from 'src/app/services/firebase-data.service';
import { ProjectService } from 'src/app/services/project.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CreateKeyDialogComponent } from '../create-key-dialog/create-key-dialog.component';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { ProjectRoles } from 'src/app/models/projectSettings.model';
import { AddProjectMemberDialogComponent, AddProjectMemberDialogResponse } from '../add-project-member-dialog/add-project-member-dialog.component';
import { AuthService } from 'src/app/auth/auth.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';

interface MemberEntry {
  kind: 'member' | 'invitation';
  memberId: string;
  role: ProjectRoles;
  invitationId?: string;
  email?: string;
  status?: 'pending';
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

          .member-role-cell {
            align-items: center;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .member-role-chip {
            align-items: center;
            border: 1px solid var(--mat-sys-outline, rgba(0, 0, 0, 0.12));
            border-radius: 999px;
            display: inline-flex;
            gap: 4px;
            line-height: 1;
            min-height: 32px;
            padding-inline: 12px 8px;
            text-transform: capitalize;
          }

          .member-role-chip.is-static {
            cursor: default;
          }

          .member-role-chip mat-icon {
            font-size: 18px;
            height: 18px;
            margin-right: -2px;
            width: 18px;
          }

          .pending-chip {
            border: 1px solid var(--mat-sys-outline, rgba(0, 0, 0, 0.12));
            border-radius: 999px;
            display: inline-flex;
            font-size: 12px;
            line-height: 1;
            margin-left: 8px;
            padding: 4px 8px;
            text-transform: uppercase;
          }
        `,
    ],
    imports: [MatList, MatListItem, MatButton, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe, MatMenuTrigger, MatMenu, MatMenuItem, MatIcon]
})
export class ProjectSettingsComponent {
  membersDisplayedColumns = ['memberId', 'role', 'action'];
  readonly assignableRoles: ProjectRoles[] = ['owner', 'admin', 'viewer'];
  membersDataSource: MatTableDataSource<MemberEntry>;
  apiKeysDisplayedColumns = ['keyId', 'createdAt', 'lastUsed', 'action'];
  apiKeysDataSource: MatTableDataSource<ApiKeyEntry>;
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private apiService = inject(ApiService);

  get projectId() { return this.firebaseDataService.projectId(); }
  projectPath: string;
  projectSettings: ProjectSettings;
  memberEmails: Record<string, string> = {};

  constructor() {
    effect(() => {
      const settings = this.firebaseDataService.projectSettings();
      this.projectPath = `/projects/${this.projectId}`;

      if (settings) {
        this.projectSettings = settings;
        this.updateMembersTable();

        if (this.projectId) {
          this.apiService.listProjectMembers(this.projectId).then(members => {
            this.memberEmails = {};
            members.forEach(m => this.memberEmails[m.memberId] = m.email || m.displayName);
            this.updateMembersTable();
          }).catch(() => {});  // non-critical, fall back to uid display
        }

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

  updateMembersTable() {
    if (!this.projectSettings) return;
    const settings = this.projectSettings;
    const memberTableData = Object.keys(settings.members || {}).map((key) => {
      return { kind: 'member' as const, memberId: key, email: this.memberEmails[key], role: settings.members![key] };
    });
    const pendingInvitationRows = this.firebaseDataService.projectInvitations()
      .filter((invitation) => invitation?.status === 'pending')
      .map((invitation: ProjectInvitationRecord) => ({
        kind: 'invitation' as const,
        memberId: invitation.email,
        email: invitation.email,
        invitationId: invitation.id,
        role: invitation.role as ProjectRoles,
        status: 'pending' as const,
      }));
    this.membersDataSource = new MatTableDataSource([...memberTableData, ...pendingInvitationRows]);
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
      })
        .then(async (inviteResponse) => {
          const emailLink = inviteResponse.firebaseEmailLink;
          if (!emailLink && inviteResponse.existingUser) {
            this.snackBar.open('Invitation created. User can accept in app.', 'Close', { duration: 4000 });
            return;
          }

          if (!emailLink) {
            this.snackBar.open('Invitation created. Email setup unavailable.', 'Close', { duration: 4000 });
            return;
          }

          await this.authService.sendInvitationEmailLink(emailLink.email, emailLink.continueUrl);
          this.snackBar.open(
            inviteResponse.existingUser
              ? 'Invitation created. Email sent and user can accept in app.'
              : 'Invitation email sent.',
            'Close',
            { duration: 4000 },
          );
        })
        .catch((error) => {
          console.error(error);
          const message = error instanceof Error ? error.message : 'Failed to create invitation';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        });
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
    if (member.kind === 'invitation') return true;
    if (member.memberId === this.currentUserId) return false;
    if (this.currentUserProjectRole === 'admin' && member.role === 'owner') return false;
    return true;
  }

  canSetRole(member: MemberEntry, nextRole: ProjectRoles): boolean {
    if (member.kind === 'invitation') return false;
    if (!this.canManageMembers()) return false;
    if (member.role === nextRole) return false;
    if (member.memberId === this.currentUserId) return false;
    if (this.currentUserProjectRole === 'admin' && (member.role === 'owner' || nextRole === 'owner')) {
      return false;
    }
    return true;
  }

  availableRoles(member: MemberEntry): ProjectRoles[] {
    return this.assignableRoles.filter((role) => this.canSetRole(member, role));
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
        const removal = member.kind === 'invitation' && member.invitationId
          ? this.projectService.revokeProjectInvitation(member.invitationId)
          : this.projectService.removeProjectMember(member.memberId);
        removal.catch(console.error);
      }
    });
  }
}
