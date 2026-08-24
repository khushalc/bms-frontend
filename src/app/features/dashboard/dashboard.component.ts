import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'bms-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="padding: 2rem;">
      <h1>BMS Dashboard</h1>
      @if (auth.me(); as me) {
        <p>Signed in as <strong>{{ me.email }}</strong></p>
        <p>Roles: {{ me.roles.length ? (me.roles | json) : 'none' }}</p>
        <p>Permissions: {{ me.permissions.join(', ') || '(none)' }}</p>
      }
      <button (click)="auth.logout()">Sign out</button>
    </section>
  `,
})
export class DashboardComponent {
  protected auth = inject(AuthService);
}
