import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarProjectSelectComponent } from './navbar-project-select.component';

describe('NavbarProjectSelectComponent', () => {
  let component: NavbarProjectSelectComponent;
  let fixture: ComponentFixture<NavbarProjectSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [NavbarProjectSelectComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarProjectSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
