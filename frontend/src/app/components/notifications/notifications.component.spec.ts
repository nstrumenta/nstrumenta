import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationsComponent } from './notifications.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let component: NotificationsComponent;
  const refreshUserProjects = vi.fn();
  const acceptProjectInvitation = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    refreshUserProjects.mockReset();
    acceptProjectInvitation.mockReset();
    acceptProjectInvitation.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        {
          provide: FirebaseDataService,
          useValue: {
            refreshUserProjects,
            notifications: signal([
              {
                id: 'n1',
                message: 'You were added to project org1/proj1 as viewer',
                createdAt: Date.now(),
              },
            ]),
          },
        },
        {
          provide: ApiService,
          useValue: {
            markNotificationRead: () => Promise.resolve(),
            acceptProjectInvitation,
            deleteNotification: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders notification messages', () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('You were added to project org1/proj1 as viewer');
  });

  it('refreshes user projects after accepting an invitation notification', async () => {
    await component.acceptInvite({ invitationId: 'invite-1', projectId: 'org1/proj1' });

    expect(acceptProjectInvitation).toHaveBeenCalledWith({
      orgId: 'org1',
      projectId: 'proj1',
      invitationId: 'invite-1',
    });
    expect(refreshUserProjects).toHaveBeenCalled();
  });
});
