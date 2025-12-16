/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NavbarAccountComponent } from './navbar-account.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

const AuthServiceStub = {
  user: of({ uid: 'mock', email: 'mock@example.com' }),
  user$: of({ uid: 'mock', email: 'mock@example.com' }),
  setUser: () => {},
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
};

class MatDialogMock {
  open() {
    return {
      afterClosed: () => of(true)
    };
  }
}

describe('NavbarAccountComponent', () => {
  let component: NavbarAccountComponent;
  let fixture: ComponentFixture<NavbarAccountComponent>;
  let dialog: MatDialog;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [MatMenuModule, MatFormFieldModule, RouterTestingModule, NavbarAccountComponent],
    providers: [
      { provide: AuthService, useValue: AuthServiceStub },
      { provide: MatDialog, useClass: MatDialogMock }
    ],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarAccountComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open login dialog when login is called', () => {
    spyOn(dialog, 'open');
    component.login();
    expect(dialog.open).toHaveBeenCalledWith(LoginDialogComponent, { width: '400px' });
  });
});
