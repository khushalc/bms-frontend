import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { StorageService } from '../services/storage.service';

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
