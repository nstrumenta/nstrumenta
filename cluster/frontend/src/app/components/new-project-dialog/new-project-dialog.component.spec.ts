import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NewProjectDialogComponent } from './new-project-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};

const firebaseDataServiceStub = {
  // Add any methods this component uses
};

describe('NewProjectDialogComponent', () => {
  let component: NewProjectDialogComponent;
  let fixture: ComponentFixture<NewProjectDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      declarations: [NewProjectDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: AuthService, useValue: authServiceStub },
        { provide: FirebaseDataService, useValue: firebaseDataServiceStub },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
