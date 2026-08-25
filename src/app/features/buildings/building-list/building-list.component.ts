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

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ActiveFiltersComponent, ActiveFilterChip } from '../../../shared/filters/active-filters.component';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type YesNoAny = '' | 'yes' | 'no';

interface AppliedFilters {
  name: string;
  number: string;
  address: string;
  gym: YesNoAny;
  pool: YesNoAny;
}
const EMPTY: AppliedFilters = { name: '', number: '', address: '', gym: '', pool: '' };

@Component({
  selector: 'bms-building-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent, ActiveFiltersComponent,
  ],
  templateUrl: './building-list.component.html',
  styleUrl: './building-list.component.scss',
})
export class BuildingListComponent implements OnInit {
  private api = inject(BuildingApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  dataSource = new MatTableDataSource<Building>([]);
  displayedColumns = ['number', 'name', 'address', 'floors', 'flats', 'amenities', 'actions'];

  // Menu inputs — pending; only applied on Search
  nameFilter = new FormControl<string>('', { nonNullable: true });
  numberFilter = new FormControl<string>('', { nonNullable: true });
  addressFilter = new FormControl<string>('', { nonNullable: true });
  gymFilter = new FormControl<YesNoAny>('', { nonNullable: true });
  poolFilter = new FormControl<YesNoAny>('', { nonNullable: true });

  private applied = signal<AppliedFilters>({ ...EMPTY });

  activeChips = computed<ActiveFilterChip[]>(() => {
    const a = this.applied();
    const chips: ActiveFilterChip[] = [];
    if (a.name) chips.push({ key: 'name', label: 'Name', value: a.name });
    if (a.number) chips.push({ key: 'number', label: 'Number', value: a.number });
    if (a.address) chips.push({ key: 'address', label: 'Address', value: a.address });
    if (a.gym) chips.push({ key: 'gym', label: 'Gym', value: a.gym === 'yes' ? 'Has gym' : 'No gym' });
    if (a.pool) chips.push({ key: 'pool', label: 'Pool', value: a.pool === 'yes' ? 'Has pool' : 'No pool' });
    return chips;
  });

  activeFilterCount = computed(() => this.activeChips().length);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (b) => {
      const a = this.applied();
      if (a.name && !b.name.toLowerCase().includes(a.name.toLowerCase())) return false;
      if (a.number && !b.number.toLowerCase().includes(a.number.toLowerCase())) return false;
      if (a.address && !(b.address ?? '').toLowerCase().includes(a.address.toLowerCase())) return false;
      if (a.gym === 'yes' && !b.has_gym) return false;
      if (a.gym === 'no' && b.has_gym) return false;
      if (a.pool === 'yes' && !b.has_swimming_pool) return false;
      if (a.pool === 'no' && b.has_swimming_pool) return false;
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
        this.reapplyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load buildings');
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
      number: this.numberFilter.value.trim(),
      address: this.addressFilter.value.trim(),
      gym: this.gymFilter.value,
      pool: this.poolFilter.value,
    });
    this.reapplyFilter();
  }

  onClearAll(): void {
    this.nameFilter.setValue('');
    this.numberFilter.setValue('');
    this.addressFilter.setValue('');
    this.gymFilter.setValue('');
    this.poolFilter.setValue('');
    this.applied.set({ ...EMPTY });
    this.reapplyFilter();
  }

  onRemoveChip(key: string): void {
    const control = ({
      name: this.nameFilter, number: this.numberFilter, address: this.addressFilter,
      gym: this.gymFilter, pool: this.poolFilter,
    } as const)[key as keyof AppliedFilters];
    control?.setValue('' as never);
    this.applied.update((a) => ({ ...a, [key]: '' }));
    this.reapplyFilter();
  }

  private reapplyFilter(): void {
    // toggling .filter to a unique value triggers MatTableDataSource to re-evaluate filterPredicate
    this.dataSource.filter = this.activeFilterCount() === 0 ? '' : String(Date.now());
  }
}
