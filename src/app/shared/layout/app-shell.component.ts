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

  currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  currentTitle = computed(() => {
    const url = this.currentUrl();
    // Match longest nav item path to display title (e.g. /flats/1/edit → "Flats")
    const match = [...NAV_ITEMS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((n) => (n.exact ? url === n.path : url === n.path || url.startsWith(n.path + '/')));
    return match?.label ?? 'BMS';
  });

  navItems = signal<NavItem[]>(NAV_ITEMS);

  canSee(item: NavItem): boolean {
    return !item.permission || this.auth.hasPermission(item.permission);
  }

  onNavigate(): void {
    if (this.isMobile()) this.sidenav?.close();
  }

  logout(): void {
    this.auth.logout();
  }
}
