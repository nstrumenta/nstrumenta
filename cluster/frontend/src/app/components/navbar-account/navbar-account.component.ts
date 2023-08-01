import { Component, inject } from '@angular/core';
import { Auth, GithubAuthProvider, User, signInWithPopup, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-navbar-account',
  templateUrl: './navbar-account.component.html',
  styleUrls: ['./navbar-account.component.scss'],
})
export class NavbarAccountComponent {
  subscriptions = new Array<Subscription>();
  auth: Auth = inject(Auth);
  private authService = inject(AuthService);
  loggedIn = false;
  user$ = user(this.auth);
  userSubscription: Subscription;

  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.loggedIn = aUser ? true : false;
      this.authService.setUser(aUser);
    });
  }

  async logout() {
    await this.auth.signOut();
    this.loggedIn = false;
  }

  async login() {
    return await signInWithPopup(this.auth, new GithubAuthProvider());
  }
}
