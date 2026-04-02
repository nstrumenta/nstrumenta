import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { waitlistGuard } from './waitlist.guard';
import { AuthService } from '../auth/auth.service';
import { runInInjectionContext } from '@angular/core';

function runGuard(): Observable<boolean | UrlTree> {
  return TestBed.runInInjectionContext(() => waitlistGuard(null, null)) as Observable<
    boolean | UrlTree
  >;
}

describe('waitlistGuard', () => {
  let routerSpy: MockedObject<Router>;
  let userStatusSubject: BehaviorSubject<string | null>;

  beforeEach(() => {
    userStatusSubject = new BehaviorSubject<string | null>(null);
    routerSpy = {
      parseUrl: vi.fn().mockName('Router.parseUrl'),
      navigate: vi.fn().mockName('Router.navigate'),
    } as unknown as MockedObject<Router>;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: { userStatus$: userStatusSubject.asObservable() } },
      ],
    });
  });

  it('should not emit while status is null (loading state)', async () => {
    const result$ = runGuard();
    let emitted = false;
    result$.subscribe(() => {
      emitted = true;
    });
    setTimeout(() => {
      expect(emitted).toBe(false);
    }, 50);
  });

  it('should allow navigation once status resolves from null to approved', async () => {
    const result$ = runGuard();
    result$.subscribe((result) => {
      expect(result).toBe(true);
    });
    userStatusSubject.next('approved');
  });

  it('should redirect to /waitlist when status resolves from null to pending', async () => {
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.mockReturnValue(mockUrlTree);
    const result$ = runGuard();
    result$.subscribe((result) => {
      expect(result).toBe(mockUrlTree);
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/waitlist');
    });
    userStatusSubject.next('pending');
  });

  it('should allow navigation if user is already approved', async () => {
    userStatusSubject.next('approved');
    const result$ = runGuard();
    result$.subscribe((result) => {
      expect(result).toBe(true);
    });
  });

  it('should redirect if user is already pending', async () => {
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.mockReturnValue(mockUrlTree);
    userStatusSubject.next('pending');
    const result$ = runGuard();
    result$.subscribe((result) => {
      expect(result).toBe(mockUrlTree);
    });
  });
});
