import { Injectable } from '@angular/core';

// Prefixed with `bms.` so localStorage inspector clearly shows what's ours,
// and to avoid collision with anything else sharing the origin.
const ACCESS_KEY = 'bms.access_token';
const REFRESH_KEY = 'bms.refresh_token';

/**
 * Thin wrapper around localStorage for the JWT pair. Isolating this
 * makes it trivial to swap to cookies or IndexedDB later (e.g. if we
 * move to HTTP-only cookies for the refresh token) without touching
 * every consumer.
 *
 * Does NOT extend BaseService — BaseService injects StorageService,
 * so extending would create a DI cycle.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /** Return the stored access token, or null if never set/cleared. */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  /** Return the stored refresh token, or null if never set/cleared. */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  /** Persist both tokens atomically (in intent, not in localStorage's API). */
  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }

  /** Remove both tokens. Called on logout and on 401 from the interceptor. */
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}
