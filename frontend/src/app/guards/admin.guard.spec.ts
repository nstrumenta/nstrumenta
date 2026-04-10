import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { adminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';

function runGuard(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => adminGuard(null as any, null as any)) as boolean | UrlTree;
}

describe('adminGuard', () => {
  let routerSpy: MockedObject<Router>;
  let mockUrlTree: UrlTree;
  let roleSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    mockUrlTree = {} as UrlTree;
    routerSpy = {
      parseUrl: vi.fn().mockReturnValue(mockUrlTree),
    } as unknown as MockedObject<Router>;

    roleSignal = signal<string | null>(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        {
          provide: AuthService,
          useValue: { currentUserRole: roleSignal },
        },
      ],
    });
  });

  it('should allow navigation when role is admin', () => {
    roleSignal.set('admin');
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should redirect to / when role is null (unauthenticated)', () => {
    roleSignal.set(null);
    const result = runGuard();
    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });

  it('should redirect to / when role is a non-admin value', () => {
    roleSignal.set('member');
    const result = runGuard();
    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });
});
