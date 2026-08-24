import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
