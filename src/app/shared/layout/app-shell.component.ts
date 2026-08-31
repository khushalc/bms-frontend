import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NAV_ITEMS, NavItem } from './nav-items';

/**
 * App layout shell — sidenav + toolbar + <router-outlet />.
 *
 * Wraps every authed route (via a child-routes hierarchy in
 * app.routes.ts) so navigation stays visible while feature pages come
 * and go inside the content area.
 *
 * Responsive behavior:
 *   - Desktop / large tablet — sidenav in 'side' mode, always open.
 *   - HandsetPortrait / TabletPortrait — sidenav in 'over' mode (drawer),
 *     collapsed by default, opened via the hamburger button. Closes
 *     automatically on nav so the user isn't stuck with a covered viewport.
 *
 * The current toolbar title is derived by matching the URL against
 * `NAV_ITEMS` (longest path wins, so /flats/1/edit still says "Flats").
 */
@Component({
  selector: 'bms-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private breakpoints = inject(BreakpointObserver);
  private router = inject(Router);
  protected auth = inject(AuthService);

  @ViewChild(MatSidenav) private sidenav?: MatSidenav;

  /** true when the viewport is ≤ 959px (Handset + small tablet portrait). */
  isMobile = toSignal(
    this.breakpoints.observe([Breakpoints.HandsetPortrait, Breakpoints.TabletPortrait]).pipe(
      map((s) => s.matches),
    ),
    { initialValue: false },
  );

  /** Signal wrapping the router's `urlAfterRedirects` on every NavigationEnd. */
  currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Toolbar page title derived from the current URL. Sort by path length
   * DESC so more-specific nav entries win (imagine future /flats/archive
   * next to /flats — longest match wins).
   * `exact=true` items only match an exact URL (used for the Dashboard).
   */
  currentTitle = computed(() => {
    const url = this.currentUrl();
    // Match longest nav item path to display title (e.g. /flats/1/edit → "Flats")
    const match = [...NAV_ITEMS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((n) => (n.exact ? url === n.path : url === n.path || url.startsWith(n.path + '/')));
    return match?.label ?? 'BMS';
  });

  navItems = signal<NavItem[]>(NAV_ITEMS);

  /** Filter callback — an item is visible when the user holds the item's
   *  optional permission (or the item has no permission requirement). */
  canSee(item: NavItem): boolean {
    return !item.permission || this.auth.hasPermission(item.permission);
  }

  /** Auto-close the mobile drawer after picking a nav item. On desktop
   *  the sidenav stays open, so this is a no-op there. */
  onNavigate(): void {
    if (this.isMobile()) this.sidenav?.close();
  }

  /** Sign out and route to /login (delegated to AuthService.logout). */
  logout(): void {
    this.auth.logout();
  }
}
