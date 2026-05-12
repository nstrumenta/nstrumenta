import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    imports: [FormsModule, MatIconButton, MatButton, MatIcon, CdkCopyToClipboard, MatFormField, MatLabel, MatInput, MatError, MatHint, RouterLink]
})
export class UserProfileComponent implements OnInit {
  public authService = inject(AuthService);
  private apiService = inject(ApiService);
  private firebaseDataService = inject(FirebaseDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  username = signal<string | null>(null);
  usernameInput = '';
  usernameAvailable: boolean | null = null;
  usernameError = '';
  isSaving = false;
  emailInput = '';
  emailLinkError = '';
  emailLinkSent = false;
  isSendingEmailLink = false;

  private readonly USERNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  private readonly RESERVED = new Set([
    'admin', 'settings', 'new', 'waitlist', 'login', 'signup',
    'api', 'mcp', 'oauth', 'health', 'config', 'assets', '_'
  ]);

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    this.emailInput = user.email || '';

    try {
      const linkResult = await this.authService.completePendingEmailLink();
      if (linkResult === 'linked') {
        this.emailLinkSent = false;
        this.emailLinkError = '';
        this.snackBar.open('Email linked successfully.', 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      this.emailLinkError = error?.message || 'Failed to complete email linking.';
    }

    const snapshot = await this.firebaseDataService.getUserDocOnce(user.uid);
    const existing = snapshot['username'] as string | undefined;
    if (existing) {
      this.username.set(existing);
      return;
    }

    // Pre-fill suggestion from GitHub provider or email prefix
    const githubProvider = (user.providerData || []).find(p => p.providerId === 'github.com');
    const suggestion = githubProvider?.displayName
      ?? user.displayName
      ?? user.email?.split('@')[0]
      ?? '';
    this.usernameInput = suggestion.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    await this.checkAvailability();
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

  async checkAvailability(): Promise<void> {
    const v = this.usernameInput.toLowerCase();
    this.usernameAvailable = null;
    this.usernameError = '';

    if (v.length < 2 || v.length > 39) {
      this.usernameError = 'Must be 2–39 characters';
      return;
    }
    if (!this.USERNAME_REGEX.test(v)) {
      this.usernameError = 'Only lowercase letters, numbers, and hyphens (not at start/end)';
      return;
    }
    if (this.RESERVED.has(v)) {
      this.usernameError = 'That name is reserved';
      return;
    }

    this.usernameAvailable = !(await this.firebaseDataService.slugExists(v));
    if (!this.usernameAvailable) {
      this.usernameError = 'Username is already taken';
    }
  }

  async saveUsername(): Promise<void> {
    if (this.isSaving || !this.usernameAvailable) return;
    this.isSaving = true;
    this.usernameError = '';
    try {
      const apiUrl = await this.apiService.getApiUrl();
      const user = this.authService.currentUser();
      const idToken = await user.getIdToken();
      const res = await fetch(`${apiUrl}/api/user/setup-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ username: this.usernameInput.toLowerCase() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const { username } = await res.json();
      this.username.set(username);
      this.snackBar.open(`Username set to @${username}`, 'Close', { duration: 3000 });
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.router.navigateByUrl(returnUrl || '/');
    } catch (err: any) {
      this.usernameError = err.message || 'Failed to save username';
    } finally {
      this.isSaving = false;
    }
  }

  onCopied(copied: boolean) {
    if (copied) {
      this.snackBar.open('User ID copied to clipboard!', 'Close', { duration: 2000 });
    }
  }
}

