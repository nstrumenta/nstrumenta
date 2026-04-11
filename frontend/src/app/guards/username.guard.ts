import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';

export const usernameGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const firebaseDataService = inject(FirebaseDataService);

  const user = authService.currentUser();
  if (!user) return true;

  return from(firebaseDataService.getUserDocOnce(user.uid)).pipe(
    map(data => {
      const username = data['username'];
      if (username) return true;
      const queryParams = state.url !== '/' ? { returnUrl: state.url } : {};
      return router.createUrlTree(['/account/profile'], { queryParams });
    })
  );
};
