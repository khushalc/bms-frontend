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
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { FlatApiService } from '../../../core/services/flat-api.service';
import { Flat } from '../../../core/models/flat.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

interface FlatRow extends Flat {
  buildingName?: string;
  buildingNumber?: string;
}

@Component({
  selector: 'bms-flat-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HasPermissionDirective,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
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

  dataSource = new MatTableDataSource<FlatRow>([]);
  displayedColumns = ['number', 'floor', 'name_on_board', 'building', 'members', 'vehicles', 'actions'];

  filter = new FormControl<string>('', { nonNullable: true });

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (f, term) => {
      const t = term.toLowerCase();
      return (
        f.number.toLowerCase().includes(t) ||
        String(f.floor).includes(t) ||
        (f.name_on_board?.toLowerCase().includes(t) ?? false) ||
        (f.buildingName?.toLowerCase().includes(t) ?? false) ||
        (f.buildingNumber?.toLowerCase().includes(t) ?? false)
      );
    };
    this.filter.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((v) => {
      this.dataSource.filter = v.trim().toLowerCase();
    });
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
          return { rows, total: flats.total };
        }),
      )
      .subscribe({
        next: ({ rows, total }) => {
          this.dataSource.data = rows;
          this.total.set(total);
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
}
