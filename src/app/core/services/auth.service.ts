import { computed, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { LoginRequest, Me, TokenPair } from '../models/auth.model';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseService {
  private readonly _me = signal<Me | null>(null);
  readonly me = this._me.asReadonly();
  readonly isAuthenticated = computed(() => this._me() !== null);
  readonly permissions = computed(() => new Set(this._me()?.permissions ?? []));

  login(payload: LoginRequest): Observable<TokenPair> {
    return this.http.post<TokenPair>(`${this.config.baseUrl}/auth/login`, payload).pipe(
      tap((tokens) => {
        this.storage.setTokens(tokens.access_token, tokens.refresh_token);
      }),
    );
  }

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

  loadMe(): Observable<Me | null> {
    return this.http.get<Me>(`${this.config.baseUrl}/auth/me`).pipe(
      tap((me) => this._me.set(me)),
      catchError(() => {
        this._me.set(null);
        return of(null);
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    this._me.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(key: string): boolean {
    const perms = this.permissions();
    return perms.has('*') || perms.has(key);
  }
}
