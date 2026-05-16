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

  it('supports manual completion when callback has no pending email in storage', async () => {
    vi.spyOn(authService, 'hasPendingEmailLinkInUrl').mockReturnValue(true);
    vi.spyOn(authService, 'completePendingEmailLink')
      .mockRejectedValueOnce({ code: 'auth/missing-email-for-link', message: 'Enter your email address to complete verification.' })
      .mockResolvedValueOnce('linked');

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.requiresEmailForLinkCompletion).toBe(true);

    component.emailInput = 'person@example.com';
    await component.completeEmailLinkFromInput();

    expect(authService.completePendingEmailLink).toHaveBeenLastCalledWith('person@example.com');
    expect(component.requiresEmailForLinkCompletion).toBe(false);
  });
});
