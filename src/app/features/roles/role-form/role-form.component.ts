import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { PermissionApiService, Permission } from '../../../core/services/permission-api.service';
import { RoleApiService } from '../../../core/services/role-api.service';

interface PermissionGroup {
  resource: string;
  items: Permission[];
}

@Component({
  selector: 'bms-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private roleApi = inject(RoleApiService);
  private permApi = inject(PermissionApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  id = signal<number | null>(null);
  isSystem = signal(false);

  allPermissions = signal<Permission[]>([]);
  selectedIds = signal<Set<number>>(new Set());

  groups = computed<PermissionGroup[]>(() => {
    const byRes = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      const res = p.key.includes('.') ? p.key.split('.')[0] : 'other';
      const arr = byRes.get(res) ?? [];
      arr.push(p);
      byRes.set(res, arr);
    }
    return [...byRes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, items]) => ({ resource, items }));
  });

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      forkJoin({
        role: this.roleApi.get(id),
        perms: this.permApi.list({ page_size: 200 }),
      }).subscribe({
        next: ({ role, perms }) => {
          this.allPermissions.set(perms.items);
          this.selectedIds.set(new Set(role.permissions.map((p) => p.id)));
          this.isSystem.set(role.is_system);
          this.form.patchValue({
            name: role.name,
            description: role.description ?? '',
          });
          if (role.is_system) this.form.controls.name.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(true);
      this.permApi.list({ page_size: 200 }).subscribe({
        next: (r) => { this.allPermissions.set(r.items); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  toggle(pid: number): void {
    const s = new Set(this.selectedIds());
    if (s.has(pid)) s.delete(pid); else s.add(pid);
    this.selectedIds.set(s);
  }

  isChecked(pid: number): boolean {
    return this.selectedIds().has(pid);
  }

  toggleGroup(g: PermissionGroup): void {
    const s = new Set(this.selectedIds());
    const allOn = g.items.every((p) => s.has(p.id));
    if (allOn) {
      g.items.forEach((p) => s.delete(p.id));
    } else {
      g.items.forEach((p) => s.add(p.id));
    }
    this.selectedIds.set(s);
  }

  groupState(g: PermissionGroup): 'all' | 'some' | 'none' {
    const s = this.selectedIds();
    const hits = g.items.filter((p) => s.has(p.id)).length;
    if (hits === 0) return 'none';
    if (hits === g.items.length) return 'all';
    return 'some';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const perm_ids = [...this.selectedIds()];
    const req = this.id()
      ? this.roleApi.update(this.id()!, {
          name: this.isSystem() ? undefined : v.name,
          description: v.description || null,
          permission_ids: perm_ids,
        })
      : this.roleApi.create({
          name: v.name,
          description: v.description || null,
          permission_ids: perm_ids,
        });
    req.subscribe({
      next: () => this.router.navigate(['/roles']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
