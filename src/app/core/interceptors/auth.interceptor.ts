import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { StorageService } from '../services/storage.service';

/**
 * HTTP interceptor that attaches `Authorization: Bearer <access-token>`
 * to every outgoing request that doesn't already have one.
 *
 * Skips attaching when:
 *   - no token is stored (anonymous request — e.g. /auth/login itself), or
 *   - the caller already set an Authorization header (rare, but respected
 *     so a manual override wins).
 *
 * Registered in `app.config.ts` after `requestIdInterceptor` and before
 * `errorInterceptor`, so a 401 caused by an expired token still passes
 * through the error interceptor which handles the redirect.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const token = storage.getAccessToken();
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }
  const authed = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authed);
};
