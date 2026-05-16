import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatError, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatFormField, MatLabel, MatInput, MatError, MatHint],
  template: `
    <div class="waitlist-page">
      <div class="top-bar">
        <img src="assets/images/nstrumenta-logo.svg" alt="nstrumenta logo" class="logo">
      </div>
      
      <div class="centered-content">
        <mat-card class="waitlist-card">
          <mat-card-header>
            <div mat-card-avatar class="header-icon">
              <mat-icon>hourglass_empty</mat-icon>
            </div>
            <mat-card-title>Account Pending Approval</mat-card-title>
            <mat-card-subtitle>You are on the waitlist</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content class="card-body">
            <p>
              Thanks for signing up! To ensure a great experience for our early users, new accounts are currently subject to manual review.
            </p>

            @if (authService.currentUser()?.email) {
              <p>
                We will notify you at <strong>{{ authService.currentUser()?.email }}</strong> once your account has been approved.
              </p>
            } @else {
              <p>
                Add your email address now so invitations and approval notifications can reach you.
              </p>
              <div class="email-linking">
                @if (requiresEmailForLinkCompletion) {
                  <p>Verification link opened without saved session state. Enter the same email address to complete linking.</p>
                }
                <mat-form-field>
                  <mat-label>Email address</mat-label>
                  <input matInput
                        [(ngModel)]="emailInput"
                        type="email"
                        autocomplete="email"
                        placeholder="name@example.com" />
                  @if (emailLinkError) {
                    <mat-error>{{ emailLinkError }}</mat-error>
                  }
                  @if (emailLinkSent) {
                    <mat-hint>Check your inbox and open the link while still signed in.</mat-hint>
                  }
                </mat-form-field>
                <div class="email-actions">
                  <button mat-flat-button
                          [disabled]="isSendingEmailLink"
                          (click)="sendEmailLink()">
                    {{ isSendingEmailLink ? 'Sending...' : 'Send verification link' }}
                  </button>
                  @if (hasEmailLinkCallback) {
                    <button mat-stroked-button
                            [disabled]="isCompletingEmailLink"
                            (click)="completeEmailLinkFromInput()">
                      {{ isCompletingEmailLink ? 'Completing...' : 'Complete verification' }}
                    </button>
                  }
                </div>
              </div>
            }
          </mat-card-content>
          
          <mat-card-actions class="card-actions">
            <button mat-outlined-button (click)="signOut()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .waitlist-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .top-bar {
      height: 64px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      box-shadow: var(--mat-sys-level1);
    }
    
    .logo {
      height: 32px;
    }
    
    .centered-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .waitlist-card {
      max-width: 500px;
      padding: 16px;
    }
    
    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-surface-container-high);
      border-radius: 50%;
    }
    
    .card-body {
      margin-top: 20px;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px 0 0 0;
    }

    .email-linking {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .email-linking p {
      margin: 0;
    }

    .email-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `]
})
export class WaitlistComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  emailInput = '';
  emailLinkError = '';
  emailLinkSent = false;
  isSendingEmailLink = false;
  hasEmailLinkCallback = false;
  requiresEmailForLinkCompletion = false;
  isCompletingEmailLink = false;

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    this.emailInput = user.email || '';
    this.hasEmailLinkCallback = this.authService.hasPendingEmailLinkInUrl();

    try {
      const result = await this.authService.completePendingEmailLink();
      if (result === 'linked') {
        this.emailLinkError = '';
        this.requiresEmailForLinkCompletion = false;
        this.snackBar.open('Email linked successfully.', 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      if (error?.code === 'auth/missing-email-for-link') {
        this.requiresEmailForLinkCompletion = true;
      }
      this.emailLinkError = error?.message || 'Failed to complete email linking.';
    }
  }

  async sendEmailLink(): Promise<void> {
    this.emailLinkError = '';
    this.emailLinkSent = false;

    if (!this.emailInput.trim()) {
      this.emailLinkError = 'Email is required';
      return;
    }

    this.isSendingEmailLink = true;
    try {
      await this.authService.sendEmailLinkForCurrentUser(this.emailInput);
      this.emailLinkSent = true;
      this.snackBar.open(`Verification link sent to ${this.emailInput}.`, 'Close', { duration: 4000 });
    } catch (error: any) {
      this.emailLinkError = error?.message || 'Failed to send email verification link.';
    } finally {
      this.isSendingEmailLink = false;
    }
  }

  async completeEmailLinkFromInput(): Promise<void> {
    this.emailLinkError = '';

    if (!this.emailInput.trim()) {
      this.emailLinkError = 'Email is required';
      return;
    }

    this.isCompletingEmailLink = true;
    try {
      const result = await this.authService.completePendingEmailLink(this.emailInput);
      if (result === 'linked') {
        this.requiresEmailForLinkCompletion = false;
        this.snackBar.open('Email linked successfully.', 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      this.emailLinkError = error?.message || 'Failed to complete email linking.';
    } finally {
      this.isCompletingEmailLink = false;
    }
  }

  async signOut() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
