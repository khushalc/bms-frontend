import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { API_CONFIG } from '../config/api.config';
import { StorageService } from './storage.service';

/**
 * Common base for app services. Provides the cross-cutting injectables
 * (HttpClient, API_CONFIG, StorageService, Router) so subclasses don't
 * have to re-inject them. Access via `this.http`, `this.config`, etc.
 *
 * Rules:
 * - Do NOT add `@Injectable()` here — this is an abstract shape, not a provider.
 *   Concrete subclasses carry `@Injectable({ providedIn: 'root' })`.
 * - Do NOT extend this from any service that BaseService itself injects
 *   (e.g. StorageService) — that would create a DI cycle.
 * - Opt-in only. A service that legitimately doesn't need HTTP or a Router
 *   (e.g. a pure utility) should stay a plain @Injectable and NOT extend this.
 *
 * Trade-off accepted: subclasses carry all four refs even if they only use
 * one. Cost is negligible (root singletons, cached by DI), and the win is
 * one consistent shape for every service.
 */
export abstract class BaseService {
  protected http = inject(HttpClient);
  protected config = inject(API_CONFIG);
  protected storage = inject(StorageService);
  protected router = inject(Router);
}
