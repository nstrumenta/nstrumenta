import { Component, inject } from '@angular/core';
import { Auth, GithubAuthProvider, User, signInWithPopup, user } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-navbar-account',
    templateUrl: './navbar-account.component.html',
    styleUrls: ['./navbar-account.component.scss'],
    imports: [MatMenu, MatMenuItem, RouterLink, MatIconButton, MatMenuTrigger, MatIcon, MatButton]
})
export class NavbarAccountComponent {
  auth = inject(Auth);
  private authService = inject(AuthService);
  private router = inject(Router);

  subscriptions = new Array<Subscription>();
  loggedIn = false;
  user$: Observable<User | null>;
  userSubscription: Subscription;

  constructor() {
    this.user$ = user(this.auth);
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.loggedIn = aUser ? true : false;
      this.authService.setUser(aUser);
    });
  }

  async logout() {
    await this.auth.signOut();
    this.loggedIn = false;
    this.router.navigate(['/'], {
      queryParamsHandling: 'preserve'
    });
  }

  async login() {
    return await signInWithPopup(this.auth, new GithubAuthProvider());
  }
}
