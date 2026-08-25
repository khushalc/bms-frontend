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
import { forkJoin, map } from 'rxjs';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { FlatApiService } from '../../../core/services/flat-api.service';
import { Flat } from '../../../core/models/flat.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ActiveFiltersComponent, ActiveFilterChip } from '../../../shared/filters/active-filters.component';
import { FiltersComponent } from '../../../shared/filters/filters.component';

interface FlatRow extends Flat {
  buildingName?: string;
  buildingNumber?: string;
}

interface AppliedFilters {
  number: string;
  floor: string;
  nameOnBoard: string;
  buildingId: number | '';
}
const EMPTY: AppliedFilters = { number: '', floor: '', nameOnBoard: '', buildingId: '' };

@Component({
  selector: 'bms-flat-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, HasPermissionDirective,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatSelectModule,
    FiltersComponent, ActiveFiltersComponent,
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

  private applied = signal<AppliedFilters>({ ...EMPTY });

  activeChips = computed<ActiveFilterChip[]>(() => {
    const a = this.applied();
    const chips: ActiveFilterChip[] = [];
    if (a.number) chips.push({ key: 'number', label: 'Flat #', value: a.number });
    if (a.floor) chips.push({ key: 'floor', label: 'Floor', value: a.floor });
    if (a.nameOnBoard) chips.push({ key: 'nameOnBoard', label: 'Name on board', value: a.nameOnBoard });
    if (a.buildingId !== '') {
      const b = this.buildings().find((x) => x.id === a.buildingId);
      chips.push({ key: 'buildingId', label: 'Building', value: b?.name ?? `#${a.buildingId}` });
    }
    return chips;
  });

  activeFilterCount = computed(() => this.activeChips().length);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (f) => {
      const a = this.applied();
      if (a.number && !f.number.toLowerCase().includes(a.number.toLowerCase())) return false;
      if (a.floor && String(f.floor) !== a.floor) return false;
      if (a.nameOnBoard && !(f.name_on_board ?? '').toLowerCase().includes(a.nameOnBoard.toLowerCase())) return false;
      if (a.buildingId !== '' && f.building_id !== a.buildingId) return false;
      return true;
    };
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
          this.reapplyFilter();
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

  onSearch(): void {
    this.applied.set({
      number: this.numberFilter.value.trim(),
      floor: this.floorFilter.value.trim(),
      nameOnBoard: this.nameOnBoardFilter.value.trim(),
      buildingId: this.buildingFilter.value,
    });
    this.reapplyFilter();
  }

  onClearAll(): void {
    this.numberFilter.setValue('');
    this.floorFilter.setValue('');
    this.nameOnBoardFilter.setValue('');
    this.buildingFilter.setValue('');
    this.applied.set({ ...EMPTY });
    this.reapplyFilter();
  }

  onRemoveChip(key: string): void {
    switch (key) {
      case 'number': this.numberFilter.setValue(''); this.applied.update((a) => ({ ...a, number: '' })); break;
      case 'floor': this.floorFilter.setValue(''); this.applied.update((a) => ({ ...a, floor: '' })); break;
      case 'nameOnBoard': this.nameOnBoardFilter.setValue(''); this.applied.update((a) => ({ ...a, nameOnBoard: '' })); break;
      case 'buildingId': this.buildingFilter.setValue(''); this.applied.update((a) => ({ ...a, buildingId: '' })); break;
    }
    this.reapplyFilter();
  }

  private reapplyFilter(): void {
    this.dataSource.filter = this.activeFilterCount() === 0 ? '' : String(Date.now());
  }
}
