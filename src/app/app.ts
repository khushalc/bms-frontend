import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { StorageService } from './core/services/storage.service';

/**
 * Root component of the app. Its only responsibility is to boot the auth
 * state: if a stored access token exists, hydrate the `me` signal so
 * guards/UI see the current user before the first navigation completes.
 *
 * The actual layout lives in `AppShellComponent` (mounted under the
 * root child route in `app.routes.ts`); this component just renders
 * a `<router-outlet />`.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private storage = inject(StorageService);

  /**
   * On startup, if the user has a stored token from a previous session,
   * fetch their profile so guards and hasPermission directives can gate
   * correctly on the first render. `.subscribe()` because loadMe() is
   * cold and won't fire otherwise.
   */
  ngOnInit(): void {
    if (this.storage.getAccessToken()) {
      this.auth.loadMe().subscribe();
    }
  }
}
