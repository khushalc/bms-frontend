import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Role, RoleApiService } from '../../../core/services/role-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type RoleType = '' | 'system' | 'custom';

@Component({
  selector: 'bms-role-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent,
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

  private nameSig = toSignal(this.nameFilter.valueChanges, { initialValue: '' });
  private descSig = toSignal(this.descFilter.valueChanges, { initialValue: '' });
  private typeSig = toSignal(this.typeFilter.valueChanges, { initialValue: '' as RoleType });

  activeFilterCount = computed(() =>
    [this.nameSig(), this.descSig(), this.typeSig()]
      .filter((v) => v !== '' && v !== null).length,
  );

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (r) => {
      const n = this.nameFilter.value.trim().toLowerCase();
      const d = this.descFilter.value.trim().toLowerCase();
      const t = this.typeFilter.value;
      if (n && !r.name.toLowerCase().includes(n)) return false;
      if (d && !(r.description ?? '').toLowerCase().includes(d)) return false;
      if (t === 'system' && !r.is_system) return false;
      if (t === 'custom' && r.is_system) return false;
      return true;
    };

    const bump = () => { this.dataSource.filter = String(Date.now()); };
    this.nameFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.descFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.typeFilter.valueChanges.subscribe(bump);

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

  clearFilters(): void {
    this.nameFilter.setValue('');
    this.descFilter.setValue('');
    this.typeFilter.setValue('');
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
