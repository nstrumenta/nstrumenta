import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  template: `<mat-toolbar>User</mat-toolbar>
    <div class="content">
      <div class="nav">
        <mat-nav-list>
          <a mat-menu-item [routerLink]="['profile']">
            Profile
          </a>
          <a mat-menu-item [routerLink]="['integrations']">
            Integrations
          </a>
          <a mat-menu-item [routerLink]="['sign-in-methods']">
            Sign In Methods
          </a>
        </mat-nav-list>
      </div>

      <div class="outlet">
        <router-outlet></router-outlet>
      </div>
    </div>`,
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
