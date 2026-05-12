import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockAuthService, MockApiService, MockFirebaseDataService } from 'src/app/testing/mocks';

import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [UserProfileComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: ApiService, useClass: MockApiService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows missing-email guidance when provider has no email', () => {
    authService.currentUser.set({ uid: 'no-email-user', providerData: [] } as any);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Not available from sign-in provider');
    expect(fixture.nativeElement.textContent).toContain('Send verification link');
  });

  it('sends verification link from profile action', async () => {
    authService.currentUser.set({ uid: 'no-email-user', providerData: [] } as any);
    const sendSpy = vi.spyOn(authService, 'sendEmailLinkForCurrentUser').mockResolvedValue();
    component.emailInput = 'person@example.com';

    await component.sendEmailLink();

    expect(sendSpy).toHaveBeenCalledWith('person@example.com');
    expect(component.emailLinkSent).toBe(true);
  });
});
