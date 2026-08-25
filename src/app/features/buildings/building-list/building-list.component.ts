import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ViewChild } from '@angular/core';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { Building } from '../../../core/models/building.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'bms-building-list',
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

  filter = new FormControl<string>('', { nonNullable: true });

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (b, term) => {
      const t = term.toLowerCase();
      return (
        b.name.toLowerCase().includes(t) ||
        b.number.toLowerCase().includes(t) ||
        (b.address?.toLowerCase().includes(t) ?? false)
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
}
