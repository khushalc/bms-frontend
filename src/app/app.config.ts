import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { requestIdInterceptor } from './core/interceptors/request-id.interceptor';

/**
 * Root application configuration wired into `bootstrapApplication` in
 * `main.ts`. Everything the app needs at DI setup time lives here:
 *
 *  - `provideBrowserGlobalErrorListeners` — surfaces unhandled errors
 *    to Angular's error handling pipeline instead of just the console.
 *  - `provideAnimationsAsync` — required by Angular Material for its
 *    ripple/menu/dialog animations. `async` variant defers the CDK
 *    animation module import until first use for a smaller initial bundle.
 *  - `provideRouter` — mounts the top-level route table.
 *    `withComponentInputBinding` binds `[flatId]` etc. from URL params
 *    into `@Input()` decorators without manually reading ActivatedRoute.
 *  - `provideHttpClient` — the interceptor order is significant:
 *      1. requestIdInterceptor — adds X-Request-ID header (must run before auth so it's applied to every outgoing request)
 *      2. authInterceptor       — attaches the Bearer token if one is stored
 *      3. errorInterceptor      — catches 401 (bounces to /login) and logs failures
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([requestIdInterceptor, authInterceptor, errorInterceptor]),
    ),
  ],
};
