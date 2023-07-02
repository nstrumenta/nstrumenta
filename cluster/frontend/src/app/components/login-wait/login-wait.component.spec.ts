import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoginWaitComponent } from './login-wait.component';

describe('LoginWaitComponent', () => {
  let component: LoginWaitComponent;
  let fixture: ComponentFixture<LoginWaitComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoginWaitComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginWaitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
