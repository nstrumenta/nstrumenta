import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditDialogComponent } from './edit-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const firebaseDataServiceStub = {
  // Add any methods this component uses
};

describe('EditDialogComponent', () => {
  let component: EditDialogComponent;
  let fixture: ComponentFixture<EditDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [BrowserAnimationsModule, FormsModule, MatFormFieldModule, MatInputModule, EditDialogComponent],
    providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: FirebaseDataService, useValue: firebaseDataServiceStub },
    ],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
