import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  constructor(public authService: AuthService, public router: Router) {}

  loginWithGithub() {
    this.authService.loginWithGithub();
    this.router.navigate(['/login-wait']);
  }

  ngOnInit() {
    this.subscription = this.authService.user.subscribe((user) => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
