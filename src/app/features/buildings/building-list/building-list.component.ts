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

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { FiltersComponent } from '../../../shared/filters/filters.component';

type YesNoAny = '' | 'yes' | 'no';

@Component({
  selector: 'bms-building-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent,
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

  nameFilter = new FormControl<string>('', { nonNullable: true });
  numberFilter = new FormControl<string>('', { nonNullable: true });
  addressFilter = new FormControl<string>('', { nonNullable: true });
  gymFilter = new FormControl<YesNoAny>('', { nonNullable: true });
  poolFilter = new FormControl<YesNoAny>('', { nonNullable: true });

  private nameSig = toSignal(this.nameFilter.valueChanges, { initialValue: '' });
  private numberSig = toSignal(this.numberFilter.valueChanges, { initialValue: '' });
  private addressSig = toSignal(this.addressFilter.valueChanges, { initialValue: '' });
  private gymSig = toSignal(this.gymFilter.valueChanges, { initialValue: '' as YesNoAny });
  private poolSig = toSignal(this.poolFilter.valueChanges, { initialValue: '' as YesNoAny });

  activeFilterCount = computed(() =>
    [this.nameSig(), this.numberSig(), this.addressSig(), this.gymSig(), this.poolSig()]
      .filter((v) => v !== '' && v !== null).length,
  );

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (b) => {
      const n = this.nameFilter.value.trim().toLowerCase();
      const num = this.numberFilter.value.trim().toLowerCase();
      const a = this.addressFilter.value.trim().toLowerCase();
      const g = this.gymFilter.value;
      const p = this.poolFilter.value;
      if (n && !b.name.toLowerCase().includes(n)) return false;
      if (num && !b.number.toLowerCase().includes(num)) return false;
      if (a && !(b.address ?? '').toLowerCase().includes(a)) return false;
      if (g === 'yes' && !b.has_gym) return false;
      if (g === 'no' && b.has_gym) return false;
      if (p === 'yes' && !b.has_swimming_pool) return false;
      if (p === 'no' && b.has_swimming_pool) return false;
      return true;
    };

    const bump = () => { this.dataSource.filter = String(Date.now()); };
    this.nameFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.numberFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.addressFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.gymFilter.valueChanges.subscribe(bump);
    this.poolFilter.valueChanges.subscribe(bump);

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list({ page: this.pageIndex() + 1, page_size: this.pageSize() }).subscribe({
      next: (r) => {
        this.dataSource.data = r.items;
        this.total.set(r.total);
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

  clearFilters(): void {
    this.nameFilter.setValue('');
    this.numberFilter.setValue('');
    this.addressFilter.setValue('');
    this.gymFilter.setValue('');
    this.poolFilter.setValue('');
  }
}
