import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginDialogComponent } from './login-dialog.component';
import { AuthService } from '../../auth/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MockAuthService, MockMatDialogRef } from '../../testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('LoginDialogComponent', () => {
  let component: LoginDialogComponent;
  let fixture: ComponentFixture<LoginDialogComponent>;
  let authService: MockAuthService;
  let dialogRef: MockMatDialogRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: MatDialogRef, useClass: MockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginDialogComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    dialogRef = TestBed.inject(MatDialogRef) as unknown as MockMatDialogRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Sign In" title by default', () => {
    const title = fixture.debugElement.query(By.css('h2')).nativeElement;
    expect(title.textContent).toContain('Sign In');
  });

  it('should toggle to "Create Account" mode', () => {
    component.toggleMode();
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css('h2')).nativeElement;
    expect(title.textContent).toContain('Create Account');
  });

  it('should call loginWithGoogle when google button is clicked', async () => {
    spyOn(authService, 'loginWithGoogle').and.callThrough();
    spyOn(dialogRef, 'close');

    await component.googleLogin();

    expect(authService.loginWithGoogle).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should call loginWithEmail when form is submitted in login mode', async () => {
    spyOn(authService, 'loginWithEmail').and.callThrough();
    spyOn(dialogRef, 'close');

    component.email = 'test@example.com';
    component.password = 'password';
    await component.emailLogin();

    expect(authService.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should call registerWithEmail when form is submitted in register mode', async () => {
    spyOn(authService, 'registerWithEmail').and.callThrough();
    spyOn(dialogRef, 'close');

    component.toggleMode(); // Switch to register
    component.email = 'new@example.com';
    component.password = 'newpassword';
    await component.emailLogin();

    expect(authService.registerWithEmail).toHaveBeenCalledWith('new@example.com', 'newpassword');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should display error message if login fails', async () => {
    spyOn(authService, 'loginWithEmail').and.returnValue(Promise.reject(new Error('Login failed')));
    
    component.email = 'fail@example.com';
    component.password = 'password';
    await component.emailLogin();
    fixture.detectChanges();

    const errorMsg = fixture.debugElement.query(By.css('.error-message')).nativeElement;
    expect(errorMsg.textContent).toContain('Login failed');
  });
});
