import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MemberRole } from '../../core/models/flat-member.model';
import {
  GlobalMemberApiService,
  GlobalMemberListItem,
  GlobalMemberQuery,
} from '../../core/services/global-member-api.service';

@Component({
  selector: 'bms-member-global-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './member-global-list.component.html',
  styleUrl: './member-global-list.component.scss',
})
export class MemberGlobalListComponent implements OnInit {
  private api = inject(GlobalMemberApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  dataSource = new MatTableDataSource<GlobalMemberListItem>([]);

  displayedColumns = ['name', 'flat', 'building', 'role', 'contact', 'committee'];

  search = new FormControl<string>('', { nonNullable: true });
  roleFilter = new FormControl<MemberRole | ''>('', { nonNullable: true });
  committeeFilter = new FormControl<'' | 'true' | 'false'>('', { nonNullable: true });

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  ngOnInit(): void {
    this.load();
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.pageIndex.set(0); this.load(); });
    this.roleFilter.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => { this.pageIndex.set(0); this.load(); });
    this.committeeFilter.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(() => { this.pageIndex.set(0); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const q: GlobalMemberQuery = {
      page: this.pageIndex() + 1,
      page_size: this.pageSize(),
    };
    const s = this.search.value.trim();
    if (s) q.search = s;
    if (this.roleFilter.value) q.role = this.roleFilter.value as MemberRole;
    if (this.committeeFilter.value !== '') q.is_committee_member = this.committeeFilter.value === 'true';

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

  roleLabel(r: MemberRole): string {
    return r === 'primary' ? 'Primary'
      : r === 'co_applicant' ? 'Co-applicant'
      : 'Family';
  }
}
