import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

const authServiceStub = {
  currentUser: signal<any>({ uid: 'mock' }),
};

const firebaseDataServiceStub = {
  userProjects: signal([]),
  setUser: vi.fn(),
};

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule, ProjectListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: FirebaseDataService, useValue: firebaseDataServiceStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
