import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

/**
 * `/account/change-password` — signed-in self-serve. Requires the user
 * to type their current password (backend verifies) plus the new one
 * twice (client validates that both entries match).
 */
@Component({
  selector: 'bms-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);

  saving = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.group(
    {
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: [matchPasswords('new_password', 'confirm_password')] },
  );

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    const v = this.form.getRawValue();
    this.auth.changePassword(v.current_password, v.new_password).subscribe({
      next: () => {
        this.success.set(true);
        this.saving.set(false);
        this.form.reset();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Change failed');
        this.saving.set(false);
      },
    });
  }
}

/** Cross-field validator: fails when new and confirm don't match. */
function matchPasswords(a: string, b: string): ValidatorFn {
  return (group: AbstractControl) => {
    const av = group.get(a)?.value;
    const bv = group.get(b)?.value;
    return av && bv && av !== bv ? { mismatch: true } : null;
  };
}
