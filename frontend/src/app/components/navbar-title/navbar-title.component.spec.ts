import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarTitleComponent } from './navbar-title.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavbarTitleComponent', () => {
  let component: NavbarTitleComponent;
  let fixture: ComponentFixture<NavbarTitleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule, NavbarTitleComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
