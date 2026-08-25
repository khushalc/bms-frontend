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
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { FlatApiService } from '../../../core/services/flat-api.service';
import { Flat } from '../../../core/models/flat.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { FiltersComponent } from '../../../shared/filters/filters.component';

interface FlatRow extends Flat {
  buildingName?: string;
  buildingNumber?: string;
}

@Component({
  selector: 'bms-flat-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent,
  ],
  templateUrl: './flat-list.component.html',
  styleUrl: './flat-list.component.scss',
})
export class FlatListComponent implements OnInit {
  private flatApi = inject(FlatApiService);
  private buildingApi = inject(BuildingApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  buildings = signal<Building[]>([]);

  dataSource = new MatTableDataSource<FlatRow>([]);
  displayedColumns = ['number', 'floor', 'name_on_board', 'building', 'members', 'vehicles', 'actions'];

  numberFilter = new FormControl<string>('', { nonNullable: true });
  floorFilter = new FormControl<string>('', { nonNullable: true });
  nameOnBoardFilter = new FormControl<string>('', { nonNullable: true });
  buildingFilter = new FormControl<number | ''>('', { nonNullable: true });

  private numSig = toSignal(this.numberFilter.valueChanges, { initialValue: '' });
  private floorSig = toSignal(this.floorFilter.valueChanges, { initialValue: '' });
  private nobSig = toSignal(this.nameOnBoardFilter.valueChanges, { initialValue: '' });
  private buildingSig = toSignal(this.buildingFilter.valueChanges, { initialValue: '' as number | '' });

  activeFilterCount = computed(() =>
    [this.numSig(), this.floorSig(), this.nobSig(), this.buildingSig()]
      .filter((v) => v !== '' && v !== null).length,
  );

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (f) => {
      const num = this.numberFilter.value.trim().toLowerCase();
      const fl = this.floorFilter.value.trim();
      const nob = this.nameOnBoardFilter.value.trim().toLowerCase();
      const bid = this.buildingFilter.value;
      if (num && !f.number.toLowerCase().includes(num)) return false;
      if (fl && String(f.floor) !== fl) return false;
      if (nob && !(f.name_on_board ?? '').toLowerCase().includes(nob)) return false;
      if (bid !== '' && f.building_id !== bid) return false;
      return true;
    };

    const bump = () => { this.dataSource.filter = String(Date.now()); };
    this.numberFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.floorFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.nameOnBoardFilter.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(bump);
    this.buildingFilter.valueChanges.subscribe(bump);

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      flats: this.flatApi.list({ page: this.pageIndex() + 1, page_size: this.pageSize() }),
      buildings: this.buildingApi.list({ page_size: 200 }),
    })
      .pipe(
        map(({ flats, buildings }) => {
          const bmap = new Map<number, Building>(buildings.items.map((b) => [b.id, b]));
          const rows: FlatRow[] = flats.items.map((f) => ({
            ...f,
            buildingName: bmap.get(f.building_id)?.name,
            buildingNumber: bmap.get(f.building_id)?.number,
          }));
          return { rows, total: flats.total, buildings: buildings.items };
        }),
      )
      .subscribe({
        next: ({ rows, total, buildings }) => {
          this.dataSource.data = rows;
          this.total.set(total);
          this.buildings.set(buildings);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load flats');
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
    this.numberFilter.setValue('');
    this.floorFilter.setValue('');
    this.nameOnBoardFilter.setValue('');
    this.buildingFilter.setValue('');
  }
}
