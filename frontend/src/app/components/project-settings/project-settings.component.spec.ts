import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectSettingsComponent } from './project-settings.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ProjectService } from 'src/app/services/project.service';
import { ServerService } from 'src/app/services/server.service';
import { MatDialog } from '@angular/material/dialog';
import { MockActivatedRoute, MockServerService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<any>>;
    sendInvitationEmailLink: ReturnType<typeof vi.fn>;
  };
  let projectServiceMock: {
    inviteProjectMember: ReturnType<typeof vi.fn>;
    updateProjectMemberRole: ReturnType<typeof vi.fn>;
    removeProjectMember: ReturnType<typeof vi.fn>;
    revokeProjectInvitation: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dialogMock = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    snackBarMock = {
      open: vi.fn(),
    };

    authServiceMock = {
      currentUser: signal({ uid: 'owner1' }),
      sendInvitationEmailLink: vi.fn().mockResolvedValue(undefined),
    };

    projectServiceMock = {
      inviteProjectMember: vi.fn().mockResolvedValue({
        existingUser: true,
        requiresEmailBootstrap: false,
        firebaseEmailLink: {
          email: 'new@example.com',
          continueUrl: 'https://app.example.com/accept-invite?orgId=org1&projectId=proj1&invitationId=invite-1',
          handleCodeInApp: true,
        },
      }),
      updateProjectMemberRole: vi.fn().mockResolvedValue(undefined),
      removeProjectMember: vi.fn().mockResolvedValue(undefined),
      revokeProjectInvitation: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [ProjectSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: FirebaseDataService,
          useValue: {
            projectId: () => 'org1/proj1',
            projectSettings: signal({
              members: {
                owner1: 'owner',
                admin1: 'admin',
                viewer1: 'viewer',
              },
              apiKeys: {},
            }),
            projectInvitations: signal([
              {
                id: 'invite-1',
                email: 'pending@example.com',
                role: 'viewer',
                status: 'pending',
              },
            ]),
          },
        },
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: ServerService, useClass: MockServerService },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens invite dialog and calls project service with dialog response', async () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of({ email: 'new@example.com', role: 'viewer' }),
    });

    component.inviteMember();
    await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialogMock.open).toHaveBeenCalled();
    expect(projectServiceMock.inviteProjectMember).toHaveBeenCalledWith({
      email: 'new@example.com',
      role: 'viewer',
    });
    expect(authServiceMock.sendInvitationEmailLink).toHaveBeenCalledWith(
      'new@example.com',
      'https://app.example.com/accept-invite?orgId=org1&projectId=proj1&invitationId=invite-1',
    );
    expect(snackBarMock.open).toHaveBeenCalledWith('Invitation created. Email sent and user can accept in app.', 'Close', { duration: 4000 });
  });

  it('allows owner to promote viewer to admin', () => {
    component.setMemberRole({ kind: 'member', memberId: 'viewer1', role: 'viewer' }, 'admin');
    expect(projectServiceMock.updateProjectMemberRole).toHaveBeenCalledWith({
      memberId: 'viewer1',
      role: 'admin',
    });
  });

  it('opens confirmation and removes member when confirmed', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    component.removeMember({ kind: 'member', memberId: 'viewer1', role: 'viewer' });

    expect(projectServiceMock.removeProjectMember).toHaveBeenCalledWith('viewer1');
  });

  it('includes pending invitations in the members table data', () => {
    expect(component.membersDataSource.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: 'pending@example.com', kind: 'invitation', status: 'pending' }),
      ]),
    );
  });

  it('cancels a pending invitation when confirmed', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    component.removeMember({
      kind: 'invitation',
      memberId: 'pending@example.com',
      email: 'pending@example.com',
      invitationId: 'invite-1',
      role: 'viewer',
      status: 'pending',
    });

    expect(projectServiceMock.revokeProjectInvitation).toHaveBeenCalledWith('invite-1');
  });
});
