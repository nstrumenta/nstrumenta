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

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let projectServiceMock: {
    inviteProjectMember: ReturnType<typeof vi.fn>;
    updateProjectMemberRole: ReturnType<typeof vi.fn>;
    removeProjectMember: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dialogMock = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    projectServiceMock = {
      inviteProjectMember: vi.fn().mockResolvedValue(undefined),
      updateProjectMemberRole: vi.fn().mockResolvedValue(undefined),
      removeProjectMember: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [ProjectSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ uid: 'owner1' }),
          },
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
          },
        },
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: ServerService, useClass: MockServerService },
        { provide: MatDialog, useValue: dialogMock }
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

  it('opens invite dialog and calls project service with dialog response', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of({ email: 'new@example.com', role: 'viewer' }),
    });

    component.inviteMember();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(projectServiceMock.inviteProjectMember).toHaveBeenCalledWith({
      email: 'new@example.com',
      role: 'viewer',
    });
  });

  it('allows owner to promote viewer to admin', () => {
    component.setMemberRole({ memberId: 'viewer1', role: 'viewer' }, 'admin');
    expect(projectServiceMock.updateProjectMemberRole).toHaveBeenCalledWith({
      memberId: 'viewer1',
      role: 'admin',
    });
  });

  it('opens confirmation and removes member when confirmed', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    component.removeMember({ memberId: 'viewer1', role: 'viewer' });

    expect(projectServiceMock.removeProjectMember).toHaveBeenCalledWith('viewer1');
  });
});
