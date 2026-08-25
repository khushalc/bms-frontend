import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { Role, RoleApiService } from '../../../core/services/role-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ActiveFiltersComponent, ActiveFilterChip } from '../../../shared/filters/active-filters.component';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type RoleType = '' | 'system' | 'custom';

interface AppliedFilters {
  name: string;
  desc: string;
  type: RoleType;
}
const EMPTY: AppliedFilters = { name: '', desc: '', type: '' };

@Component({
  selector: 'bms-role-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent, ActiveFiltersComponent,
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

  nameFilter = new FormControl<string>('', { nonNullable: true });
  descFilter = new FormControl<string>('', { nonNullable: true });
  typeFilter = new FormControl<RoleType>('', { nonNullable: true });

  private applied = signal<AppliedFilters>({ ...EMPTY });

  activeChips = computed<ActiveFilterChip[]>(() => {
    const a = this.applied();
    const chips: ActiveFilterChip[] = [];
    if (a.name) chips.push({ key: 'name', label: 'Name', value: a.name });
    if (a.desc) chips.push({ key: 'desc', label: 'Description', value: a.desc });
    if (a.type) chips.push({ key: 'type', label: 'Type', value: a.type === 'system' ? 'System' : 'Custom' });
    return chips;
  });

  activeFilterCount = computed(() => this.activeChips().length);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (r) => {
      const a = this.applied();
      if (a.name && !r.name.toLowerCase().includes(a.name.toLowerCase())) return false;
      if (a.desc && !(r.description ?? '').toLowerCase().includes(a.desc.toLowerCase())) return false;
      if (a.type === 'system' && !r.is_system) return false;
      if (a.type === 'custom' && r.is_system) return false;
      return true;
    };
    this.load();
  }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.list({ page: this.pageIndex() + 1, page_size: this.pageSize() }).subscribe({
      next: (r) => {
        this.dataSource.data = r.items;
        this.total.set(r.total);
        this.reapplyFilter();
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

  onSearch(): void {
    this.applied.set({
      name: this.nameFilter.value.trim(),
      desc: this.descFilter.value.trim(),
      type: this.typeFilter.value,
    });
    this.reapplyFilter();
  }

  onClearAll(): void {
    this.nameFilter.setValue('');
    this.descFilter.setValue('');
    this.typeFilter.setValue('');
    this.applied.set({ ...EMPTY });
    this.reapplyFilter();
  }

  onRemoveChip(key: string): void {
    switch (key) {
      case 'name': this.nameFilter.setValue(''); this.applied.update((a) => ({ ...a, name: '' })); break;
      case 'desc': this.descFilter.setValue(''); this.applied.update((a) => ({ ...a, desc: '' })); break;
      case 'type': this.typeFilter.setValue(''); this.applied.update((a) => ({ ...a, type: '' })); break;
    }
    this.reapplyFilter();
  }

  private reapplyFilter(): void {
    this.dataSource.filter = this.activeFilterCount() === 0 ? '' : String(Date.now());
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
