import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Static 403 page. `permissionGuard` redirects here when the user is
 * signed in but lacks the required key. Sits outside the AppShell so
 * we don't reveal navigation the user can't access.
 */
@Component({
  selector: 'bms-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section style="padding: 2rem;">
      <h1>403 — Forbidden</h1>
      <p>You do not have permission to view this page.</p>
      <a routerLink="/">Back to dashboard</a>
    </section>
  `,
})
export class ForbiddenComponent {}
