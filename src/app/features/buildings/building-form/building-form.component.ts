import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BuildingApiService } from '../../../core/services/building-api.service';

/**
 * Building create/edit form. Same component handles both:
 * an `:id` route param switches to edit mode (loads the row on init,
 * PATCHes on save); otherwise POSTs a new building on save.
 */
@Component({
  selector: 'bms-building-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './building-form.component.html',
  styleUrl: './building-form.component.scss',
})
export class BuildingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(BuildingApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  id = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    number: ['', [Validators.required, Validators.maxLength(50)]],
    address: [''],
    floor_count: [1, [Validators.required, Validators.min(1), Validators.max(200)]],
    declared_flat_count: [0, [Validators.min(0), Validators.max(10000)]],
    gst_number: ['', [Validators.maxLength(20)]],
    mahada_bmc_registration_number: ['', [Validators.maxLength(100)]],
    has_gym: [false],
    has_swimming_pool: [false],
  });

  /**
   * On mount, check for an `:id` route param. Present → edit mode:
   * fetch the row and patch the form. Absent → create mode: form
   * stays with its default values.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.api.get(id).subscribe({
        next: (b) => {
          this.form.patchValue({
            name: b.name,
            number: b.number,
            address: b.address ?? '',
            floor_count: b.floor_count,
            declared_flat_count: b.declared_flat_count ?? 0,
            gst_number: b.gst_number ?? '',
            mahada_bmc_registration_number: b.mahada_bmc_registration_number ?? '',
            has_gym: b.has_gym ?? false,
            has_swimming_pool: b.has_swimming_pool ?? false,
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  /**
   * Persist the form. Empty optional strings are normalized to null so
   * the backend treats them as "unset" rather than "set to empty" —
   * matters for future validators that would reject empty-string
   * addresses / GST numbers. In edit mode PATCHes; otherwise POSTs.
   * On success navigates back to the list.
   */
  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    // normalize empty optional strings to null so backend sees "unset"
    const payload = {
      name: v.name,
      number: v.number,
      address: v.address || null,
      floor_count: v.floor_count,
      declared_flat_count: v.declared_flat_count,
      gst_number: v.gst_number || null,
      mahada_bmc_registration_number: v.mahada_bmc_registration_number || null,
      has_gym: v.has_gym,
      has_swimming_pool: v.has_swimming_pool,
    };
    const req = this.id()
      ? this.api.update(this.id()!, payload)
      : this.api.create(payload);
    req.subscribe({
      next: () => this.router.navigate(['/buildings']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
