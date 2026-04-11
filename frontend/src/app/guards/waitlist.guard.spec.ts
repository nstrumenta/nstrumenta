import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { waitlistGuard } from './waitlist.guard';
import { AuthService } from '../auth/auth.service';

const mockState: any = { url: '/dashboard' };

function runGuard(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => waitlistGuard(null as any, mockState)) as boolean | UrlTree;
}

describe('waitlistGuard', () => {
  let routerSpy: MockedObject<Router>;
  let currentUserSignal: ReturnType<typeof signal<any>>;
  let userStatusSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    currentUserSignal = signal<any>({ uid: 'test-uid' });
    userStatusSignal = signal<string | null>('approved');
    routerSpy = {
      parseUrl: vi.fn().mockName('Router.parseUrl'),
      navigate: vi.fn().mockName('Router.navigate'),
      createUrlTree: vi.fn().mockReturnValue('/' as any),
    } as unknown as MockedObject<Router>;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: {
          currentUser: currentUserSignal,
          userStatus: userStatusSignal,
        }},
      ],
    });
  });

  it('redirects to / with returnUrl when not logged in', () => {
    currentUserSignal.set(null);
    runGuard();
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/'], { queryParams: { returnUrl: '/dashboard' } });
  });

  it('allows navigation when user is logged in and approved', () => {
    currentUserSignal.set({ uid: 'test-uid' });
    userStatusSignal.set('approved');
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('redirects to /waitlist when status is pending', () => {
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.mockReturnValue(mockUrlTree);
    currentUserSignal.set({ uid: 'test-uid' });
    userStatusSignal.set('pending');
    const result = runGuard();
    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/waitlist');
  });
});
