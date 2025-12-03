import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEmailProviderDialogComponent } from './add-email-provider-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MockMatDialogRef } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AddEmailProviderComponent', () => {
  let component: AddEmailProviderDialogComponent;
  let fixture: ComponentFixture<AddEmailProviderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEmailProviderDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useClass: MockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { description: 'test' } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEmailProviderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
