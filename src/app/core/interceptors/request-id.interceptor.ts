import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Generate a compact hex string suitable for the X-Request-ID header.
 * Prefers `crypto.randomUUID` (available in all evergreen browsers) with
 * dashes stripped for compactness; falls back to a base36 mash of random
 * + timestamp for older/test environments.
 */
function makeRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Attach an `X-Request-ID` header to every outgoing request so the
 * backend can echo it and every log line correlates. The backend
 * accepts our id verbatim if present; otherwise it generates its own.
 *
 * Runs before the auth interceptor so retries/token-refresh flows keep
 * the SAME request id — easier to trace across the log.
 */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Request-ID')) return next(req);
  const rid = makeRequestId();
  return next(req.clone({ setHeaders: { 'X-Request-ID': rid } }));
};
