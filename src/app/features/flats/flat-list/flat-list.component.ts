import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { FlatApiService } from '../../../core/services/flat-api.service';
import { Building } from '../../../core/models/building.model';
import { Flat } from '../../../core/models/flat.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

interface FlatWithBuilding extends Flat {
  buildingName?: string;
}

@Component({
  selector: 'bms-flat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  templateUrl: './flat-list.component.html',
  styleUrl: './flat-list.component.scss',
})
export class FlatListComponent implements OnInit {
  private flatApi = inject(FlatApiService);
  private buildingApi = inject(BuildingApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<FlatWithBuilding[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      flats: this.flatApi.list({ page_size: 100 }),
      buildings: this.buildingApi.list({ page_size: 100 }),
    })
      .pipe(
        map(({ flats, buildings }) => {
          const bmap = new Map<number, Building>(buildings.items.map((b) => [b.id, b]));
          return flats.items.map((f) => ({ ...f, buildingName: bmap.get(f.building_id)?.name }));
        }),
      )
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load flats');
          this.loading.set(false);
        },
      });
  }
}
