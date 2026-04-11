import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
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
            <p>
              We will notify you at <strong>{{ authService.currentUser()?.email }}</strong> once your account has been approved.
            </p>
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
  `]
})
export class WaitlistComponent {
  authService = inject(AuthService);
  router = inject(Router);

  async signOut() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
