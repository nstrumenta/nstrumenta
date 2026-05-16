import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';

import { AccountComponent } from './account.component';
import { AuthService } from 'src/app/auth/auth.service';

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ email: 'test@example.com' }),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
