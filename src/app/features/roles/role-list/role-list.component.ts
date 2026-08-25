import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Role, RoleApiService } from '../../../core/services/role-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'bms-role-list',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private api = inject(RoleApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<Role[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({ page_size: 200 }).subscribe({
      next: (r) => { this.items.set(r.items); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load roles');
        this.loading.set(false);
      },
    });
  }

  remove(r: Role): void {
    if (r.is_system) return; // backend rejects anyway
    if (!confirm(`Delete role "${r.name}"?`)) return;
    this.api.delete(r.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Delete failed'),
    });
  }
}
