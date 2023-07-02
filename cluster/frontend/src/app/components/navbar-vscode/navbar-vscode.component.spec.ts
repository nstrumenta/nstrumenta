import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarVscodeComponent } from './navbar-vscode.component';

describe('NavbarVscodeComponent', () => {
  let component: NavbarVscodeComponent;
  let fixture: ComponentFixture<NavbarVscodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarVscodeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarVscodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
