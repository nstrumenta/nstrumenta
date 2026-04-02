import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export const waitlistGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userStatus$.pipe(
    filter(status => status !== null),
    map(status => {
      if (status === 'pending') {
        return router.parseUrl('/waitlist');
      }
      return true;
    })
  );
};
