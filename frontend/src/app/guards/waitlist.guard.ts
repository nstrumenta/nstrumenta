import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export const waitlistGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authResolved$.pipe(
    filter(resolved => resolved),
    take(1),
    switchMap(() => authService.userStatus$),
    take(1),
    map(status => {
      if (status === null) return router.parseUrl('/');
      if (status === 'pending') return router.parseUrl('/waitlist');
      return true;
    })
  );
};
