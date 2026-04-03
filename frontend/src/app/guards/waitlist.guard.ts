import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const waitlistGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authResolved$.pipe(
    filter(resolved => resolved),
    take(1),
    switchMap(() => authService.user$),
    take(1),
    switchMap(user => {
      if (!user) {
        // Not logged in — stay on / but preserve deep link for after sign-in
        return of(router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } }));
      }
      // Logged in — userStatus$ may still be null while Firestore responds; wait for it
      return authService.userStatus$.pipe(
        filter(status => status !== null),
        take(1),
        map(status => {
          if (status === 'pending') return router.parseUrl('/waitlist');
          return true;
        })
      );
    })
  );
};
