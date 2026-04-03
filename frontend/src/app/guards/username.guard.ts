import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { filter, from, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const usernameGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const firestore = getFirestore();

  return authService.authResolved$.pipe(
    filter(resolved => resolved),
    take(1),
    switchMap(() => authService.user$),
    take(1),
    switchMap(user => {
      if (!user) return of(true);
      return from(getDoc(doc(firestore, `users/${user.uid}`))).pipe(
        map(snapshot => {
          const username = snapshot.data()?.['username'];
          if (username) return true;
          const queryParams = state.url !== '/' ? { returnUrl: state.url } : {};
          return router.createUrlTree(['/account/profile'], { queryParams });
        })
      );
    })
  );
};
