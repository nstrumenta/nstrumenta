import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const waitlistGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.currentUser()) {
    return router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
  }
  if (authService.userStatus() === 'pending') {
    if (state.url.startsWith('/account/profile')) {
      return true;
    }
    return router.parseUrl('/waitlist');
  }
  return true;
};
