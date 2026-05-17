import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationsComponent } from './notifications.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let component: NotificationsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        {
          provide: FirebaseDataService,
          useValue: {
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
            acceptProjectInvitation: () => Promise.resolve(),
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
});
