import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavbarAccountComponent } from './navbar-account.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

const AuthServiceStub = {
  user: of({ uid: 'mock', email: 'mock@example.com' }),
};

describe('NavbarAccountComponent', () => {
  let component: NavbarAccountComponent;
  let fixture: ComponentFixture<NavbarAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [MatMenuModule, MatFormFieldModule, RouterTestingModule, NavbarAccountComponent],
    providers: [{ provide: AuthService, useValue: AuthServiceStub }],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
