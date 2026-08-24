import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BuildingApiService } from '../../../core/services/building-api.service';

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
    address: [''],
    floor_count: [1, [Validators.required, Validators.min(1), Validators.max(200)]],
  });

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
            address: b.address ?? '',
            floor_count: b.floor_count,
          });
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
    const payload = this.form.getRawValue();
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
