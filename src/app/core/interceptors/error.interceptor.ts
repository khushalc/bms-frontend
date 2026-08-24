import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { StorageService } from '../services/storage.service';

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
