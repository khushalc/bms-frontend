import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

import { BuildingApiService } from '../../core/services/building-api.service';
import { Building } from '../../core/models/building.model';
import { MemberRole } from '../../core/models/flat-member.model';
import {
  GlobalMemberApiService,
  GlobalMemberListItem,
  GlobalMemberQuery,
} from '../../core/services/global-member-api.service';
import { ActiveFiltersComponent, ActiveFilterChip } from '../../shared/filters/active-filters.component';
import { FiltersComponent } from '../../shared/filters/filters.component';

interface AppliedFilters {
  search: string;
  buildingId: number | '';
  role: MemberRole | '';
  committee: '' | 'true' | 'false';
}
const EMPTY: AppliedFilters = { search: '', buildingId: '', role: '', committee: '' };

/**
 * Cross-flat, cross-building members list (sidenav → Members). Unlike
 * the per-flat list, filtering happens SERVER-side (the total member
 * population can be large). Filter state lives in `applied` and drives
 * the query; the FormControls hold pending values until (search) fires.
 */
@Component({
  selector: 'bms-member-global-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatProgressBarModule, FiltersComponent, ActiveFiltersComponent,
  ],
  templateUrl: './member-global-list.component.html',
  styleUrl: './member-global-list.component.scss',
})
export class MemberGlobalListComponent implements OnInit {
  private api = inject(GlobalMemberApiService);
  private buildingApi = inject(BuildingApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  buildings = signal<Building[]>([]);

  dataSource = new MatTableDataSource<GlobalMemberListItem>([]);
  displayedColumns = ['name', 'flat', 'building', 'role', 'contact', 'committee'];

  // Menu inputs — pending
  search = new FormControl<string>('', { nonNullable: true });
  buildingFilter = new FormControl<number | ''>('', { nonNullable: true });
  roleFilter = new FormControl<MemberRole | ''>('', { nonNullable: true });
  committeeFilter = new FormControl<'' | 'true' | 'false'>('', { nonNullable: true });

  private applied = signal<AppliedFilters>({ ...EMPTY });

  activeChips = computed<ActiveFilterChip[]>(() => {
    const a = this.applied();
    const chips: ActiveFilterChip[] = [];
    if (a.search) chips.push({ key: 'search', label: 'Search', value: a.search });
    if (a.buildingId !== '') {
      const b = this.buildings().find((x) => x.id === a.buildingId);
      chips.push({ key: 'buildingId', label: 'Building', value: b?.name ?? `#${a.buildingId}` });
    }
    if (a.role) chips.push({ key: 'role', label: 'Role', value: this.roleLabel(a.role) });
    if (a.committee) chips.push({ key: 'committee', label: 'Committee', value: a.committee === 'true' ? 'On committee' : 'Not on committee' });
    return chips;
  });

  activeFilterCount = computed(() => this.activeChips().length);

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.buildingApi.list({ page_size: 200 }).subscribe({
      next: (r) => this.buildings.set(r.items),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const a = this.applied();
    const q: GlobalMemberQuery = {
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
    };
    if (a.search) q.search = a.search;
    if (a.buildingId !== '') q.building_id = a.buildingId as number;
    if (a.role) q.role = a.role;
    if (a.committee !== '') q.is_committee_member = a.committee === 'true';

    this.api.list(q).subscribe({
      next: (res) => {
        this.dataSource.data = res.items;
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load members');
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
      search: this.search.value.trim(),
      buildingId: this.buildingFilter.value,
      role: this.roleFilter.value,
      committee: this.committeeFilter.value,
    });
    this.pageIndex.set(0);
    this.load();
  }

  onClearAll(): void {
    this.search.setValue('');
    this.buildingFilter.setValue('');
    this.roleFilter.setValue('');
    this.committeeFilter.setValue('');
    this.applied.set({ ...EMPTY });
    this.pageIndex.set(0);
    this.load();
  }

  onRemoveChip(key: string): void {
    switch (key) {
      case 'search': this.search.setValue(''); this.applied.update((a) => ({ ...a, search: '' })); break;
      case 'buildingId': this.buildingFilter.setValue(''); this.applied.update((a) => ({ ...a, buildingId: '' })); break;
      case 'role': this.roleFilter.setValue(''); this.applied.update((a) => ({ ...a, role: '' })); break;
      case 'committee': this.committeeFilter.setValue(''); this.applied.update((a) => ({ ...a, committee: '' })); break;
    }
    this.pageIndex.set(0);
    this.load();
  }

  roleLabel(r: MemberRole): string {
    return r === 'primary' ? 'Primary' : r === 'co_applicant' ? 'Co-applicant' : 'Family';
  }
}
