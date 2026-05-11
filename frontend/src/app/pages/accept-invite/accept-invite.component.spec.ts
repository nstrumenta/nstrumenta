import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AcceptInviteComponent } from './accept-invite.component';
import { ApiService } from '../../services/api.service';

describe('AcceptInviteComponent', () => {
  let fixture: ComponentFixture<AcceptInviteComponent>;
  let component: AcceptInviteComponent;
  let apiServiceMock: { acceptProjectInvitation: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiServiceMock = { acceptProjectInvitation: vi.fn().mockResolvedValue({ accepted: true, orgId: "org1", projectId: "proj1" }) };

    routerMock = { navigate: vi.fn().mockResolvedValue(true) };

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('accepts invitation and redirects to project settings', async () => {
    await Promise.resolve();

    expect(apiServiceMock.acceptProjectInvitation).toHaveBeenCalledWith({
      orgId: 'org1',
      projectId: 'proj1',
      invitationId: 'invite-1',
    });
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
      ],
    }).compileComponents();

    const missingFixture = TestBed.createComponent(AcceptInviteComponent);
    const missingComponent = missingFixture.componentInstance;
    missingFixture.detectChanges();

    expect(missingComponent.statusMessage).toContain("Missing invitation parameters");
    expect(apiServiceMock.acceptProjectInvitation).not.toHaveBeenCalled();
  });
});
