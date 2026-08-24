import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

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
