import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AcceptInviteComponent } from './accept-invite.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';
import { signal } from '@angular/core';
import { FirebaseDataService } from '../../services/firebase-data.service';

describe('AcceptInviteComponent', () => {
  let fixture: ComponentFixture<AcceptInviteComponent>;
  let component: AcceptInviteComponent;
  let apiServiceMock: { acceptProjectInvitation: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<any>>;
    hasPendingEmailLinkInUrl: ReturnType<typeof vi.fn>;
    signInWithInvitationEmailLink: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let firebaseDataServiceMock: { refreshUserProjects: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiServiceMock = { acceptProjectInvitation: vi.fn().mockResolvedValue({ accepted: true, orgId: "org1", projectId: "proj1" }) };

    routerMock = { navigate: vi.fn().mockResolvedValue(true) };
    authServiceMock = {
      currentUser: signal({ uid: 'user-1', email: 'invited@example.com' }),
      hasPendingEmailLinkInUrl: vi.fn().mockReturnValue(false),
      signInWithInvitationEmailLink: vi.fn().mockResolvedValue('signed-in'),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    firebaseDataServiceMock = { refreshUserProjects: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AcceptInviteComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                orgId: 'org1',
                projectId: 'proj1',
                invitationId: 'invite-1',
              }),
            },
          },
        },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FirebaseDataService, useValue: firebaseDataServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('accepts invitation and redirects to project settings', async () => {
    await component.onAcceptClick();

    expect(apiServiceMock.acceptProjectInvitation).toHaveBeenCalledWith({
      orgId: 'org1',
      projectId: 'proj1',
      invitationId: 'invite-1',
    });
    expect(firebaseDataServiceMock.refreshUserProjects).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/', 'org1', 'proj1', 'settings']);
  });

  it('shows missing parameters when query parameters are incomplete', async () => {
    apiServiceMock.acceptProjectInvitation.mockClear();
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AcceptInviteComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ orgId: "org1" }),
            },
          },
        },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FirebaseDataService, useValue: firebaseDataServiceMock },
      ],
    }).compileComponents();

    const missingFixture = TestBed.createComponent(AcceptInviteComponent);
    const missingComponent = missingFixture.componentInstance;
    missingFixture.detectChanges();

    expect(missingComponent.statusMessage).toContain("Missing invitation parameters");
    expect(apiServiceMock.acceptProjectInvitation).not.toHaveBeenCalled();
  });

  it('prompts for email when not signed in and opened from an email link', async () => {
    apiServiceMock.acceptProjectInvitation.mockRejectedValue({ status: 401 });
    authServiceMock.currentUser.set(null);
    authServiceMock.hasPendingEmailLinkInUrl.mockReturnValue(true);

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AcceptInviteComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                orgId: 'org1',
                projectId: 'proj1',
                invitationId: 'invite-1',
              }),
            },
          },
        },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FirebaseDataService, useValue: firebaseDataServiceMock },
      ],
    }).compileComponents();

    const promptFixture = TestBed.createComponent(AcceptInviteComponent);
    const promptComponent = promptFixture.componentInstance;
    promptFixture.detectChanges();
    await promptComponent.onAcceptClick();

    expect(promptComponent.showEmailPrompt).toBe(true);
    expect(promptComponent.statusMessage).toContain('Enter the invited email');
  });

  it('shows mismatch guidance for the wrong signed-in email', async () => {
    apiServiceMock.acceptProjectInvitation.mockRejectedValue({ status: 403 });
    authServiceMock.currentUser.set({ uid: 'user-2', email: 'wrong@example.com' });
    authServiceMock.hasPendingEmailLinkInUrl.mockReturnValue(true);

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AcceptInviteComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                orgId: 'org1',
                projectId: 'proj1',
                invitationId: 'invite-1',
              }),
            },
          },
        },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FirebaseDataService, useValue: firebaseDataServiceMock },
      ],
    }).compileComponents();

    const mismatchFixture = TestBed.createComponent(AcceptInviteComponent);
    const mismatchComponent = mismatchFixture.componentInstance;
    mismatchFixture.detectChanges();
    await mismatchComponent.onAcceptClick();

    expect(mismatchComponent.statusMessage).toContain('different email');
    expect(mismatchComponent.showSignOut).toBe(true);
  });
});
