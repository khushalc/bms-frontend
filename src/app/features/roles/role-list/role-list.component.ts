import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Role, RoleApiService } from '../../../core/services/role-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'bms-role-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private api = inject(RoleApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  dataSource = new MatTableDataSource<Role>([]);
  displayedColumns = ['name', 'description', 'system', 'perm_count', 'actions'];

  filter = new FormControl<string>('', { nonNullable: true });

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (r, term) => {
      const t = term.toLowerCase();
      return r.name.toLowerCase().includes(t) || (r.description?.toLowerCase().includes(t) ?? false);
    };
    this.filter.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((v) => {
      this.dataSource.filter = v.trim().toLowerCase();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list({ page: this.pageIndex() + 1, page_size: this.pageSize() }).subscribe({
      next: (r) => {
        this.dataSource.data = r.items;
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load roles');
        this.loading.set(false);
      },
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  remove(r: Role): void {
    if (r.is_system) return;
    if (!confirm(`Delete role "${r.name}"?`)) return;
    this.api.delete(r.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Delete failed'),
    });
  }
}
