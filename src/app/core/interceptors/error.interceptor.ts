import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { StorageService } from '../services/storage.service';

/**
 * Global HTTP error handler.
 *
 * On any 401 (except the login call itself — a 401 there is normal
 * "bad credentials"): clear stored tokens and redirect to /login with
 * the current URL as `returnUrl` so the app returns after re-login.
 *
 * On every error, log a short line to the browser console with
 * `[api] <status> <code> <message>` so debugging is easy without
 * expanding the full response. We DON'T show a toast here — components
 * often want to render errors inline (form field errors, empty-state
 * hints); a global toast would double up.
 *
 * The error is always re-thrown so downstream `.subscribe({ error })`
 * handlers still fire.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        storage.clear();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      // TODO: hook up a toast/notification service here
      // eslint-disable-next-line no-console
      console.error('[api]', err.status, err.error?.code, err.error?.message ?? err.message);
      return throwError(() => err);
    }),
  );
};
