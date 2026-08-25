import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import {
  Permission,
  PermissionApiService,
} from '../../../core/services/permission-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ActiveFiltersComponent, ActiveFilterChip } from '../../../shared/filters/active-filters.component';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type PermType = '' | 'custom' | 'standard';

interface AppliedFilters {
  key: string;
  name: string;
  type: PermType;
  role: string;
}
const EMPTY: AppliedFilters = { key: '', name: '', type: '', role: '' };

@Component({
  selector: 'bms-permission-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    MatChipsModule, MatBadgeModule, FiltersComponent, ActiveFiltersComponent,
  ],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss',
})
export class PermissionListComponent implements OnInit {
  private api = inject(PermissionApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(50);

  dataSource = new MatTableDataSource<Permission>([]);
  displayedColumns = ['key', 'name', 'type', 'roles', 'actions'];

  keyFilter = new FormControl<string>('', { nonNullable: true });
  nameFilter = new FormControl<string>('', { nonNullable: true });
  typeFilter = new FormControl<PermType>('', { nonNullable: true });
  roleFilter = new FormControl<string>('', { nonNullable: true });

  private applied = signal<AppliedFilters>({ ...EMPTY });

  activeChips = computed<ActiveFilterChip[]>(() => {
    const a = this.applied();
    const chips: ActiveFilterChip[] = [];
    if (a.key) chips.push({ key: 'key', label: 'Key', value: a.key });
    if (a.name) chips.push({ key: 'name', label: 'Name', value: a.name });
    if (a.type) chips.push({ key: 'type', label: 'Type', value: a.type === 'custom' ? 'Custom' : 'Standard' });
    if (a.role) chips.push({ key: 'role', label: 'Used by', value: a.role });
    return chips;
  });

  activeFilterCount = computed(() => this.activeChips().length);

  availableRoles = signal<string[]>([]);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (p) => {
      const a = this.applied();
      if (a.key && !p.key.toLowerCase().includes(a.key.toLowerCase())) return false;
      if (a.name && !p.name.toLowerCase().includes(a.name.toLowerCase())) return false;
      if (a.type === 'custom' && !p.is_custom) return false;
      if (a.type === 'standard' && p.is_custom) return false;
      if (a.role && !p.roles.some((role) => role.name === a.role)) return false;
      return true;
    };
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({ page: this.pageIndex() + 1, page_size: this.pageSize() }).subscribe({
      next: (r) => {
        this.dataSource.data = r.items;
        this.total.set(r.total);
        const set = new Set<string>();
        for (const p of r.items) for (const role of p.roles) set.add(role.name);
        this.availableRoles.set([...set].sort());
        this.reapplyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load permissions');
        this.loading.set(false);
      },
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  onSearch(): void {
    this.applied.set({
      key: this.keyFilter.value.trim(),
      name: this.nameFilter.value.trim(),
      type: this.typeFilter.value,
      role: this.roleFilter.value,
    });
    this.reapplyFilter();
  }

  onClearAll(): void {
    this.keyFilter.setValue('');
    this.nameFilter.setValue('');
    this.typeFilter.setValue('');
    this.roleFilter.setValue('');
    this.applied.set({ ...EMPTY });
    this.reapplyFilter();
  }

  onRemoveChip(k: string): void {
    switch (k) {
      case 'key': this.keyFilter.setValue(''); this.applied.update((a) => ({ ...a, key: '' })); break;
      case 'name': this.nameFilter.setValue(''); this.applied.update((a) => ({ ...a, name: '' })); break;
      case 'type': this.typeFilter.setValue(''); this.applied.update((a) => ({ ...a, type: '' })); break;
      case 'role': this.roleFilter.setValue(''); this.applied.update((a) => ({ ...a, role: '' })); break;
    }
    this.reapplyFilter();
  }

  private reapplyFilter(): void {
    this.dataSource.filter = this.activeFilterCount() === 0 ? '' : String(Date.now());
  }
}
