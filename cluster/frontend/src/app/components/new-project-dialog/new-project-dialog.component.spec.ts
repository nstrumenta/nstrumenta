import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NewProjectDialogComponent } from './new-project-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};
const collectionStub = {
  valueChanges: jasmine.createSpy('valueChanges').and.returnValue(null),
};

const angularFirestoreStub = {
  collection: jasmine.createSpy('collection').and.returnValue(collectionStub),
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
        { provide: AngularFirestore, useValue: angularFirestoreStub },
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
