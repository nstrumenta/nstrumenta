import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockAuthService, MockApiService, MockFirebaseDataService } from 'src/app/testing/mocks';

import { UserProfileComponent } from './user-profile.component';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
