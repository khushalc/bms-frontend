import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

/**
 * Route guard that requires an authenticated user.
 *
 * Three paths:
 *   1. `me` signal is already populated  — pass immediately.
 *   2. No stored access token           — redirect to /login and stash
 *                                          the intended URL as `returnUrl`
 *                                          so login can bounce back after.
 *   3. Token exists but no `me` yet     — call loadMe(); pass if the
 *                                          server accepts the token,
 *                                          otherwise redirect to /login
 *                                          (loadMe swallows the error
 *                                          and returns null on failure).
 *
 * Used on the shell parent route in `app.routes.ts` so it runs once
 * per authed session, not on every child navigation.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const storage = inject(StorageService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (!storage.getAccessToken()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return auth.loadMe().pipe(
    map((me) =>
      me ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
