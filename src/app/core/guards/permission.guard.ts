import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Usage in routes:
 *   { path: 'roles', canActivate: [authGuard, permissionGuard('role.read')], ... }
 */
export function permissionGuard(...required: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (required.every((p) => auth.hasPermission(p))) return true;
    return router.createUrlTree(['/forbidden']);
  };
}
