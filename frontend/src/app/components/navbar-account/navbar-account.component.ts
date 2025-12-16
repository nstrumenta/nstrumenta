import { Component, inject } from '@angular/core';
import { User } from 'firebase/auth';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
    selector: 'app-navbar-account',
    templateUrl: './navbar-account.component.html',
    styleUrls: ['./navbar-account.component.scss'],
    imports: [MatMenu, MatMenuItem, RouterLink, MatIconButton, MatMenuTrigger, MatIcon, MatButton]
})
export class NavbarAccountComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  subscriptions = new Array<Subscription>();
  loggedIn = false;
  user$: Observable<User | null>;
  currentUser: User | null = null;
  userSubscription: Subscription;

  constructor() {
    this.user$ = this.authService.user$;
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      this.loggedIn = aUser ? true : false;
      this.currentUser = aUser;
    });
  }

  async logout() {
    await this.authService.logout();
    this.loggedIn = false;
    this.router.navigate(['/'], {
      queryParamsHandling: 'preserve'
    });
  }

  login() {
    this.dialog.open(LoginDialogComponent, {
      width: '400px'
    });
  }
}
