import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarStatusComponent } from './navbar-status.component';

describe('NavbarStatusComponent', () => {
  let component: NavbarStatusComponent;
  let fixture: ComponentFixture<NavbarStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarStatusComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
