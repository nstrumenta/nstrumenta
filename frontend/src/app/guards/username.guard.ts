import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { filter, from, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const usernameGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const firestore = getFirestore();

  return authService.user$.pipe(
    filter(user => user !== null),
    switchMap(user =>
      from(getDoc(doc(firestore, `users/${user.uid}`)))
    ),
    switchMap(snapshot => {
      const username = snapshot.data()?.['username'];
      if (!username) {
        return [router.parseUrl('/account/profile')];
      }
      return [true];
    })
  );
};
