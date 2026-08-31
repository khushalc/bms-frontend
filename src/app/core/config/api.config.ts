import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Shape of the API config injected into services.
 * `baseUrl` includes the /api/v1 prefix so services can just append the
 * resource path (e.g. `${baseUrl}/buildings`).
 */
export interface ApiConfig {
  baseUrl: string;
}

/**
 * DI token for API config. Services read `this.config.baseUrl` instead of
 * importing `environment` directly — makes it trivial to swap the base
 * URL in tests via `{ provide: API_CONFIG, useValue: {...} }`.
 *
 * The default factory reads from the build-generated environment.ts
 * (populated by `scripts/build-environment.mjs` from .env).
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ baseUrl: environment.apiBaseUrl }),
});
