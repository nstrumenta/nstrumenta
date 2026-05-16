import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from '../../services/firebase-data.service';

import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
    selector: 'app-navbar-account',
    templateUrl: './navbar-account.component.html',
    styleUrls: ['./navbar-account.component.scss'],
    imports: [MatMenu, MatMenuItem, RouterLink, MatIconButton, MatMenuTrigger, MatIcon, MatButton, MatDivider, MatBadgeModule]
})
export class NavbarAccountComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private firebaseDataService = inject(FirebaseDataService);

  currentUser = this.authService.currentUser;
  loggedIn = computed(() => !!this.currentUser());

  unreadCount = computed(() => {
    return this.firebaseDataService.notifications().filter(n => n && !n['read']).length;
  });

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
  }

  login() {
    const urlTree = this.router.parseUrl(this.router.url);
    const returnUrl = urlTree.queryParams['returnUrl'] as string | undefined;

    this.dialog.open(LoginDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe(success => {
        if (success && returnUrl) {
          this.router.navigateByUrl(returnUrl);
        }
      });
  }
}
