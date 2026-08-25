import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  Permission,
  PermissionApiService,
} from '../../../core/services/permission-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'bms-permission-list',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss',
})
export class PermissionListComponent implements OnInit {
  private api = inject(PermissionApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<Permission[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({ page_size: 200 }).subscribe({
      next: (r) => { this.items.set(r.items); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load permissions');
        this.loading.set(false);
      },
    });
  }

  remove(p: Permission): void {
    if (!confirm(`Delete permission "${p.key}"?`)) return;
    this.api.delete(p.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Delete failed'),
    });
  }
}
