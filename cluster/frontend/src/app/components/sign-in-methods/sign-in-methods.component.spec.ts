import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInMethodsComponent } from './sign-in-methods.component';

describe('SignInMethodsComponent', () => {
  let component: SignInMethodsComponent;
  let fixture: ComponentFixture<SignInMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignInMethodsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignInMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
