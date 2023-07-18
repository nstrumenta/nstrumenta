import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-account',
  templateUrl: './navbar-account.component.html',
  styleUrls: ['./navbar-account.component.scss'],
})
export class NavbarAccountComponent implements OnInit, OnDestroy {
  subscriptions = new Array<Subscription>();
  avatarURL = null;
  userId = '';
  constructor(public authService: AuthService, private ngZone: NgZone, private router: Router) {}

  logout() {
    this.authService.logout();
  }

  login() {
    this.authService.loginWithGithub();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        if (user) {
          this.userId = user.uid;
          this.avatarURL = user.photoURL;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
