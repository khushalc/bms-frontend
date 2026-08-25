import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  Permission,
  PermissionApiService,
} from '../../../core/services/permission-api.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type PermType = '' | 'custom' | 'standard';

@Component({
  selector: 'bms-permission-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    MatChipsModule, MatBadgeModule, FiltersComponent,
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

  private keyFilterSig = toSignal(this.keyFilter.valueChanges, { initialValue: '' });
  private nameFilterSig = toSignal(this.nameFilter.valueChanges, { initialValue: '' });
  private typeFilterSig = toSignal(this.typeFilter.valueChanges, { initialValue: '' as PermType });
  private roleFilterSig = toSignal(this.roleFilter.valueChanges, { initialValue: '' });

  activeFilterCount = computed(() =>
    [this.keyFilterSig(), this.nameFilterSig(), this.typeFilterSig(), this.roleFilterSig()]
      .filter((v) => v !== '' && v !== null).length,
  );

  availableRoles = signal<string[]>([]);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (p) => {
      const k = this.keyFilter.value.trim().toLowerCase();
      const n = this.nameFilter.value.trim().toLowerCase();
      const t = this.typeFilter.value;
      const r = this.roleFilter.value;
      if (k && !p.key.toLowerCase().includes(k)) return false;
      if (n && !p.name.toLowerCase().includes(n)) return false;
      if (t === 'custom' && !p.is_custom) return false;
      if (t === 'standard' && p.is_custom) return false;
      if (r && !p.roles.some((role) => role.name === r)) return false;
      return true;
    };

    const bump = () => { this.dataSource.filter = String(Date.now()); };
    this.keyFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.nameFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.typeFilter.valueChanges.pipe(distinctUntilChanged()).subscribe(bump);
    this.roleFilter.valueChanges.pipe(distinctUntilChanged()).subscribe(bump);

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

  clearFilters(): void {
    this.keyFilter.setValue('');
    this.nameFilter.setValue('');
    this.typeFilter.setValue('');
    this.roleFilter.setValue('');
  }
}
