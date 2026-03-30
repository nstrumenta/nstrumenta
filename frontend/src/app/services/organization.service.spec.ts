import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationService } from './organization.service';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';
import { of } from 'rxjs';

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
            getApiUrl: jasmine.createSpy().and.resolveTo('http://localhost:5999'),
            buildMcpHeaders: jasmine.createSpy().and.resolveTo({ set: () => ({}) })
          }
        },
        {
          provide: AuthService,
          useValue: {
            user$: of({ uid: 'user_1' })
          }
        },
        {
          provide: 'Firestore',
          useValue: {}
        }
      ]
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

  it('should create an organization via POST', async () => {
    let result: any;
    const promise = service.createOrganization('Test Org', 'test-org').then(res => {
      result = res;
    });

    // Wait for the synchronous microtasks of the async function to execute
    await new Promise(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:5999/api/orgs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Test Org', slug: 'test-org' });
    req.flush({ id: 'org_123', name: 'Test Org', slug: 'test-org' });

    await promise;
    expect(result.id).toBe('org_123');
  });
});

