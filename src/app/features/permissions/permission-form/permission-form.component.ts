import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PermissionApiService } from '../../../core/services/permission-api.service';

/**
 * Permission edit form. Reachable only via `/permissions/:id/edit` —
 * creation is code-managed in `seeds/permissions.py`, so this form
 * always runs in edit mode with `key` and `is_custom` locked. Only
 * `name` and `description` are user-editable.
 */
@Component({
  selector: 'bms-permission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './permission-form.component.html',
  styleUrl: './permission-form.component.scss',
})
export class PermissionFormComponent implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private api = inject(PermissionApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  id = signal<number | null>(null);

  form = this.fb.group({
    key: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-z][a-z0-9_.]*$/)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    is_custom: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.api.get(id).subscribe({
        next: (p) => {
          this.form.patchValue({
            key: p.key,
            name: p.name,
            description: p.description ?? '',
            is_custom: p.is_custom,
          });
          this.form.controls.key.disable(); // key is immutable via update
          this.form.controls.is_custom.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const req = this.id()
      ? this.api.update(this.id()!, { name: v.name, description: v.description || null })
      : this.api.create({
          key: v.key,
          name: v.name,
          description: v.description || null,
          is_custom: v.is_custom,
        });
    req.subscribe({
      next: () => this.router.navigate(['/permissions']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
