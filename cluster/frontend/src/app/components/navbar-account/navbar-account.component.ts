import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthAdapter, User } from '@nstrumenta/data-adapter';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-navbar-account',
  templateUrl: './navbar-account.component.html',
  styleUrls: ['./navbar-account.component.scss'],
})
export class NavbarAccountComponent {
  subscriptions = new Array<Subscription>();
  private authAdapter = inject(AuthAdapter);
  private authService = inject(AuthService);
  private router = inject(Router);
  loggedIn = false;
  user$ = this.authAdapter.getAuthState();
  userSubscription: Subscription;

  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.loggedIn = aUser ? true : false;
      this.authService.setUser(aUser);
    });
  }

  async logout() {
    await this.authAdapter.signOut();
    this.loggedIn = false;
    this.router.navigate(['/']);
  }

  async login() {
    // The provider can be anything, it's up to the adapter to decide how to handle it.
    // In our case, the FirebaseAuthAdapter is hardcoded to use GithubAuthProvider.
    return await this.authAdapter.signInWithPopup('github');
  }
}
