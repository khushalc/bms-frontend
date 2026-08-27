import { computed, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { LoginRequest, Me, TokenPair } from '../models/auth.model';
import { BaseService } from './base.service';

/**
 * Session state + auth API calls. Exposes signals so templates and
 * guards can react without manually subscribing.
 *
 * State:
 *   - `me`             — the current user, null when signed out
 *   - `isAuthenticated` — derived signal for guards
 *   - `permissions`   — Set<string> of permission keys, derived from `me`
 *
 * Contract for HTTP methods: they only return an Observable and are
 * NOT called automatically. Callers subscribe (usually the login page,
 * the app-shell effect on boot, and the auth guard).
 */
@Injectable({ providedIn: 'root' })
export class AuthService extends BaseService {
  private readonly _me = signal<Me | null>(null);
  readonly me = this._me.asReadonly();
  readonly isAuthenticated = computed(() => this._me() !== null);
  readonly permissions = computed(() => new Set(this._me()?.permissions ?? []));

  /**
   * POST /auth/login. On success, stores the token pair. Does NOT set
   * `me` — the login page follows up with loadMe() to hydrate the user.
   */
  login(payload: LoginRequest): Observable<TokenPair> {
    return this.http.post<TokenPair>(`${this.config.baseUrl}/auth/login`, payload).pipe(
      tap((tokens) => {
        this.storage.setTokens(tokens.access_token, tokens.refresh_token);
      }),
    );
  }

  /**
   * POST /auth/refresh — rotate token pair using the stored refresh token.
   * On failure (server rejects the refresh), logs out and emits null so
   * callers don't need a separate error handler. Returns null immediately
   * when no refresh token is stored.
   */
  refresh(): Observable<TokenPair | null> {
    const rt = this.storage.getRefreshToken();
    if (!rt) return of(null);
    return this.http
      .post<TokenPair>(`${this.config.baseUrl}/auth/refresh`, { refresh_token: rt })
      .pipe(
        tap((tokens) => this.storage.setTokens(tokens.access_token, tokens.refresh_token)),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
  }

  /**
   * GET /auth/me — fetch the current user's profile + flat permissions
   * list. Populates the `me` signal on success; clears it on failure.
   * Called on app boot (if a token is stored), by the auth guard when
   * `me` is still null, and after login.
   */
  loadMe(): Observable<Me | null> {
    return this.http.get<Me>(`${this.config.baseUrl}/auth/me`).pipe(
      tap((me) => this._me.set(me)),
      catchError(() => {
        this._me.set(null);
        return of(null);
      }),
    );
  }

  /** Clear tokens + state and navigate to /login. */
  logout(): void {
    this.storage.clear();
    this._me.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Check whether the current user holds a permission. Superadmin is
   * signaled by the wildcard `*` and grants everything.
   */
  hasPermission(key: string): boolean {
    const perms = this.permissions();
    return perms.has('*') || perms.has(key);
  }
}
