import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

/**
 * Landing page after login. Since the sidenav owns nav, this page is
 * intentionally lightweight — a greeting + a card showing the current
 * user's roles + permissions (helpful for debugging permission-gated UI).
 */
@Component({
  selector: 'bms-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  /** Exposed to the template so `auth.me()` etc. can be read directly. */
  protected auth = inject(AuthService);
}
