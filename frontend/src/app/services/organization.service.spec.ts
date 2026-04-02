import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationService } from './organization.service';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom, of } from 'rxjs';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
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
          useValue: {
            user$: of({ uid: 'user_1' }),
          },
        },
        {
          provide: 'Firestore',
          useValue: {},
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

  it('should return an empty array when user is null', async () => {
    (TestBed.inject(AuthService) as any).user$ = of(null);
    const freshService: OrganizationService = TestBed.inject(OrganizationService);

    freshService.getUserOrganizations().subscribe((orgs) => {
      expect(orgs).toEqual([]);
    });
  });

  it('should GET /api/orgs and return organization list when user is logged in', async () => {
    const user = { getIdToken: () => Promise.resolve('mock-token') };
    (TestBed.inject(AuthService) as any).user$ = of(user);
    const freshService: OrganizationService = TestBed.inject(OrganizationService);

    const expectedOrgs = [
      { id: 'org1', name: 'My Org', slug: 'my-org', createdAt: 0, createdBy: 'u1' },
    ];

    const resultPromise = firstValueFrom(freshService.getUserOrganizations());

    // Flush microtasks to let Promise.all([getApiUrl, getIdToken]) resolve
    await Promise.resolve();
    await Promise.resolve();

    const req = httpMock.expectOne('http://localhost:5999/api/orgs');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(expectedOrgs);

    expect(await resultPromise).toEqual(expectedOrgs);
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
