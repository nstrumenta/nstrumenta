import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};

const firestoreStub = {
  // Mock modern Firestore methods if needed
};

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      imports: [MatDialogModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Firestore, useValue: firestoreStub },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
