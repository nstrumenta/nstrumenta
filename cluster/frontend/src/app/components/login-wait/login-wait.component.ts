import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-wait',
  templateUrl: './login-wait.component.html',
  styleUrls: ['./login-wait.component.scss'],
})
export class LoginWaitComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  constructor(public authService: AuthService, public router: Router) {}

  cancel() {
    this.authService.logout();
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
