import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectSettingsComponent } from './project-settings.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ProjectService } from 'src/app/services/project.service';
import { ServerService } from 'src/app/services/server.service';
import { MatDialog } from '@angular/material/dialog';
import { MockActivatedRoute, MockAuthService, MockFirebaseDataService, MockProjectService, MockServerService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let projectServiceMock: { inviteProjectMember: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogMock = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    projectServiceMock = {
      inviteProjectMember: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [ProjectSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
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
});
