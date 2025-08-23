import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};
const collectionStub = {
  valueChanges: jasmine.createSpy('valueChanges').and.returnValue(null),
};

const angularFirestoreStub = {
  collection: jasmine.createSpy('collection').and.returnValue(collectionStub),
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
        { provide: AngularFirestore, useValue: angularFirestoreStub },
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
