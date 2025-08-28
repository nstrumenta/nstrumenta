import { Component } from '@angular/core';
import { Auth, GithubAuthProvider, User, signInWithPopup, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-navbar-account',
    templateUrl: './navbar-account.component.html',
    styleUrls: ['./navbar-account.component.scss'],
    standalone: false
})
export class NavbarAccountComponent {
  subscriptions = new Array<Subscription>();
  loggedIn = false;
  user$: Observable<User | null>;
  userSubscription: Subscription;

  constructor(
    public auth: Auth,
    private authService: AuthService,
    private router: Router
  ) {
    this.user$ = user(this.auth);
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.loggedIn = aUser ? true : false;
      this.authService.setUser(aUser);
    });
  }

  async logout() {
    await this.auth.signOut();
    this.loggedIn = false;
    this.router.navigate(['/']);
  }

  async login() {
    return await signInWithPopup(this.auth, new GithubAuthProvider());
  }
}
