import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminUsersComponent } from './admin-users.component';
import { AuthService } from '../../auth/auth.service';
import { ApiService } from '../../services/api.service';
import { MockAuthService, MockApiService } from '../../testing/mocks';

const API_BASE = 'http://localhost:8080';

describe('AdminUsersComponent', () => {
  let component: AdminUsersComponent;
  let fixture: ComponentFixture<AdminUsersComponent>;
  let httpTesting: HttpTestingController;
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    snackBarSpy = { open: vi.fn() };
    mockAuthService = new MockAuthService();
    mockAuthService.currentUser.set({
      uid: 'test-uid',
      getIdToken: vi.fn().mockResolvedValue('fake-token'),
    });

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, HttpClientTestingModule, AdminUsersComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useClass: MockApiService },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts in loading state and renders pending users after response', async () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(component.loading()).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 0));

    const req = httpTesting.expectOne(`${API_BASE}/api/admin/users/pending`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush({
      users: [
        { uid: 'uid-1', email: 'alice@example.com', status: 'pending' },
        { uid: 'uid-2', email: 'bob@example.com', status: 'pending' },
      ],
    });

    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.pendingUsers().length).toBe(2);
    expect(component.pendingUsers()[0].email).toBe('alice@example.com');
  });

  it('shows "No pending users" message when list is empty', async () => {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    const req = httpTesting.expectOne(`${API_BASE}/api/admin/users/pending`);
    req.flush({ users: [] });

    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No pending users');
  });

  it('shows snackbar error when load fails', async () => {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    const req = httpTesting.expectOne(`${API_BASE}/api/admin/users/pending`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to load pending users',
      'Dismiss',
      { duration: 4000 },
    );
  });

  it('approve() posts to approve endpoint and removes user from list', async () => {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    const loadReq = httpTesting.expectOne(`${API_BASE}/api/admin/users/pending`);
    loadReq.flush({ users: [{ uid: 'uid-1', email: 'alice@example.com', status: 'pending' }] });
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    const user = component.pendingUsers()[0];
    component.approve(user);
    await new Promise(resolve => setTimeout(resolve, 0));

    const approveReq = httpTesting.expectOne(`${API_BASE}/api/admin/users/approve`);
    expect(approveReq.request.body).toEqual({ uid: 'uid-1' });
    approveReq.flush({});

    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.pendingUsers().length).toBe(0);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Approved alice@example.com',
      undefined,
      { duration: 3000 },
    );
  });

  it('approve() shows error snackbar and keeps user in list when request fails', async () => {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    const loadReq = httpTesting.expectOne(`${API_BASE}/api/admin/users/pending`);
    loadReq.flush({ users: [{ uid: 'uid-1', email: 'alice@example.com', status: 'pending' }] });
    await new Promise(resolve => setTimeout(resolve, 0));

    component.approve(component.pendingUsers()[0]);
    await new Promise(resolve => setTimeout(resolve, 0));

    const approveReq = httpTesting.expectOne(`${API_BASE}/api/admin/users/approve`);
    approveReq.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to approve user',
      'Dismiss',
      { duration: 4000 },
    );
    expect(component.pendingUsers().length).toBe(1);
  });
});
