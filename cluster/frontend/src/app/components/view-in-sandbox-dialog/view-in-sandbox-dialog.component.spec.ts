import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewInSandboxDialogComponent } from './view-in-sandbox-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

const collectionStub = {
  valueChanges: jasmine.createSpy('valueChanges').and.returnValue(null),
};

const angularFirestoreStub = {
  collection: jasmine.createSpy('collection').and.returnValue(collectionStub),
};

describe('ViewInSandboxDialogComponent', () => {
  let component: ViewInSandboxDialogComponent;
  let fixture: ComponentFixture<ViewInSandboxDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ViewInSandboxDialogComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: AngularFirestore, useValue: angularFirestoreStub },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewInSandboxDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
