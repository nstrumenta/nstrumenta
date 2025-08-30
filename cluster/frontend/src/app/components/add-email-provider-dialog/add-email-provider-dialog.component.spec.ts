import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmailProviderDialogComponent } from './add-email-provider-dialog.component';

describe('AddEmailProviderComponent', () => {
  let component: AddEmailProviderDialogComponent;
  let fixture: ComponentFixture<AddEmailProviderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AddEmailProviderDialogComponent]
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
