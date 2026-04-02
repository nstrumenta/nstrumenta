import { describe, it, test, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProjectDialogComponent } from './new-project-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const authServiceStub = {
  user: of({ uid: 'mock' }),
  user$: of({ uid: 'mock' }),
};

const apiServiceStub = {
  createProject: vi
    .fn()
    .mockReturnValue(
      Promise.resolve({ id: 'p1', slug: 'test', orgSlug: 'org', name: 'Test', message: 'ok' })
    ),
};

const organizationServiceStub = {
  getUserOrganizations: () =>
    of([{ id: 'org1', name: 'My Org', slug: 'my-org', createdAt: 0, createdBy: 'u1' }]),
};

describe('NewProjectDialogComponent', () => {
  let component: NewProjectDialogComponent;
  let fixture: ComponentFixture<NewProjectDialogComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDialogModule,
        BrowserAnimationsModule,
        NewProjectDialogComponent,
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: AuthService, useValue: authServiceStub },
        { provide: ApiService, useValue: apiServiceStub },
        { provide: OrganizationService, useValue: organizationServiceStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load organizations on init', () => {
    expect(component.organizations.length).toBe(1);
    expect(component.selectedOrgId).toBe('org1');
  });
});
