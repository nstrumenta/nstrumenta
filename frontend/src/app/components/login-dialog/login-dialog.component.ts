import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent {
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<LoginDialogComponent>);

  email = '';
  password = '';
  isRegistering = false;
  errorMessage = '';

  async googleLogin() {
    try {
      await this.authService.loginWithGoogle();
      this.dialogRef.close(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'An unknown error occurred';
      }
    }
  }

  async emailLogin() {
    try {
      if (this.isRegistering) {
        await this.authService.registerWithEmail(this.email, this.password);
      } else {
        await this.authService.loginWithEmail(this.email, this.password);
      }
      this.dialogRef.close(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'An unknown error occurred';
      }
    }
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.errorMessage = '';
  }
}
