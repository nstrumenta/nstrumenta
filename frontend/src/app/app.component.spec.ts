import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { OrganizationService } from './services/organization.service';
import { FirebaseDataService } from './services/firebase-data.service';
import { MockAuthService, MockFirebaseDataService } from './testing/mocks';
import { signal } from '@angular/core';

const mockOrganizationService = { organizations: signal([]) };

describe('AppComponent', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
    imports: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      { provide: AuthService, useClass: MockAuthService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      { provide: OrganizationService, useValue: mockOrganizationService },
    ],
}).compileComponents();
  });
  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
