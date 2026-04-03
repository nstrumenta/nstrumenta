import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationService } from './organization.service';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;
  let currentUserSignal: ReturnType<typeof signal<any>>;

  beforeEach(() => {
    currentUserSignal = signal(null);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrganizationService,
        {
          provide: ApiService,
          useValue: {
            getApiUrl: vi.fn().mockResolvedValue('http://localhost:5999'),
            buildMcpHeaders: vi.fn().mockResolvedValue({ set: () => ({}) }),
          },
        },
        {
          provide: AuthService,
          useValue: { currentUser: currentUserSignal },
        },
      ],
    });
    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('organizations signal is empty when user is null', () => {
    expect(service.organizations()).toEqual([]);
  });

  it('should GET /api/orgs and populate organizations signal when user signs in', async () => {
    const expectedOrgs = [
      { id: 'org1', name: 'My Org', slug: 'my-org', createdAt: 0, createdBy: 'u1' },
    ];

    TestBed.runInInjectionContext(() => {
      currentUserSignal.set({ getIdToken: () => Promise.resolve('mock-token') });
    });
    TestBed.flushEffects();

    // Let effect + Promise.all resolve
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const req = httpMock.expectOne('http://localhost:5999/api/orgs');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(expectedOrgs);

    await Promise.resolve();
    expect(service.organizations()).toEqual(expectedOrgs);
  });

  it('should create an organization via POST', async () => {
    let result: any;
    const promise = service.createOrganization('Test Org', 'test-org').then((res) => {
      result = res;
    });

    // Wait for the synchronous microtasks of the async function to execute
    await new Promise((resolve) => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:5999/api/orgs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Test Org', slug: 'test-org' });
    req.flush({ id: 'org_123', name: 'Test Org', slug: 'test-org' });

    await promise;
    expect(result.id).toBe('org_123');
  });
});
