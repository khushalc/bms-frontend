import { HttpInterceptorFn } from '@angular/common/http';

function makeRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Request-ID')) return next(req);
  const rid = makeRequestId();
  return next(req.clone({ setHeaders: { 'X-Request-ID': rid } }));
};
