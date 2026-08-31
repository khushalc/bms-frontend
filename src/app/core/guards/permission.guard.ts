import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Route guard factory. Grants access when the current user holds every
 * required permission key. Superadmin (has `*` in permissions) always
 * passes because `AuthService.hasPermission` treats `*` as grant-all.
 *
 * Usage in routes:
 *   { path: 'roles', canActivate: [authGuard, permissionGuard('role.read')], ... }
 *
 * Order matters: pair with `authGuard` first so we don't try to gate on
 * permissions before we know who the user is. On failure, redirects to
 * /forbidden rather than /login — the user IS authenticated, they just
 * lack the required permission.
 */
export function permissionGuard(...required: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (required.every((p) => auth.hasPermission(p))) return true;
    return router.createUrlTree(['/forbidden']);
  };
}
