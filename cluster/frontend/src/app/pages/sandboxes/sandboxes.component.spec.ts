import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SandboxesComponent } from './sandboxes.component';
import { MatIconModule, MatFormFieldModule, MatTableModule, MatDialogModule, MatInputModule, MatTabsModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SandboxTableComponent } from 'src/app/components/sandbox-table/sandbox-table.component';


const collectionStub = {
  valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([]))
};

const angularFirestoreStub = {
  collection: jasmine.createSpy('collection').and.returnValue(collectionStub)
};

describe('SandboxesComponent', () => {
  let component: SandboxesComponent;
  let fixture: ComponentFixture<SandboxesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        MatTableModule,
        RouterTestingModule,
        MatInputModule,
        MatTabsModule,
        MatDialogModule
      ],
      declarations: [
        SandboxesComponent,
        SandboxTableComponent,
        FileSizePipe
      ],
      providers: [
        { provide: AngularFirestore, useValue: angularFirestoreStub }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SandboxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
