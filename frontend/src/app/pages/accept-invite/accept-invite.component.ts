import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FirebaseDataService } from '../../services/firebase-data.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="accept-invite-page">
      <mat-card>
        <mat-card-title>Project Invitation</mat-card-title>
        <mat-card-content>
          <p>{{ statusMessage }}</p>
          @if (showEmailPrompt) {
            <mat-form-field>
              <mat-label>Invited email</mat-label>
              <input matInput [(ngModel)]="emailInput" type="email" />
            </mat-form-field>
          }
        </mat-card-content>
        <mat-card-actions>
          @if (showAcceptButton) {
            <button mat-flat-button color="primary" (click)="onAcceptClick()">Accept Invitation</button>
          }
          @if (showEmailPrompt) {
            <button mat-flat-button (click)="completeEmailSignIn()">Continue</button>
          }
          @if (showSignOut) {
            <button mat-button (click)="signOutAndRetry()">Use Invited Email</button>
          }
          <button mat-flat-button (click)="goHome()">Go Home</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .accept-invite-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 24px;
      }
    `,
  ],
})
export class AcceptInviteComponent {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firebaseDataService = inject(FirebaseDataService);

  private orgId = this.route.snapshot.queryParamMap.get('orgId');
  private projectId = this.route.snapshot.queryParamMap.get('projectId');
  private invitationId = this.route.snapshot.queryParamMap.get('invitationId');

  statusMessage = '';
  emailInput = '';
  showEmailPrompt = false;
  showSignOut = false;
  showAcceptButton = false;

  constructor() {
    if (!this.orgId || !this.projectId || !this.invitationId) {
      this.statusMessage = 'Missing invitation parameters.';
      return;
    }

    this.statusMessage = 'You have been invited to join this project.';
    this.showAcceptButton = true;
  }

  async onAcceptClick() {
    this.showAcceptButton = false;
    this.statusMessage = 'Accepting invitation...';
    await this.acceptInvitation();
  }

  async completeEmailSignIn() {
    this.statusMessage = 'Signing in...';
    try {
      await this.authService.signInWithInvitationEmailLink(this.emailInput);
      this.showEmailPrompt = false;
      this.showSignOut = false;
      await this.acceptInvitation();
    } catch (error) {
      console.error(error);
      this.statusMessage = 'Could not sign in with that email link. Check the invited email and try again.';
    }
  }

  async signOutAndRetry() {
    await this.authService.logout();
    this.showSignOut = false;
    this.showEmailPrompt = this.authService.hasPendingEmailLinkInUrl();
    this.statusMessage = this.showEmailPrompt
      ? 'Enter the invited email to continue.'
      : 'Sign in with the invited account to accept this invitation.';
  }

  private async acceptInvitation() {
    if (!this.orgId || !this.projectId || !this.invitationId) {
      return;
    }

    try {
      await this.apiService.acceptProjectInvitation({
        orgId: this.orgId,
        projectId: this.projectId,
        invitationId: this.invitationId,
      });
      this.firebaseDataService.refreshUserProjects();
      this.statusMessage = 'Invitation accepted. Redirecting to project settings...';
      await this.router.navigate(['/', this.orgId, this.projectId, 'settings']);
    } catch (error: any) {
      const status = error?.status;
      if (status === 401) {
        this.showEmailPrompt = this.authService.hasPendingEmailLinkInUrl();
        this.statusMessage = this.showEmailPrompt
          ? 'Enter the invited email to continue.'
          : 'Sign in with the invited account to accept this invitation.';
        return;
      }

      if (status === 403) {
        const currentEmail = this.authService.currentUser()?.email;
        this.showSignOut = !!currentEmail && this.authService.hasPendingEmailLinkInUrl();
        this.showEmailPrompt = false;
        this.statusMessage = currentEmail
          ? `This invite is for a different email than ${currentEmail}.`
          : 'This invite is for a different email address.';
        return;
      }

      this.statusMessage = error instanceof Error ? error.message : 'Failed to accept invitation. Please try again.';
    }
  }

  goHome() {
    this.router.navigate(['/']).catch(console.error);
  }
}
