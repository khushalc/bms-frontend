import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

/**
 * Public /reset-password page — no auth required. The reset token is
 * read from the `?token=…` query param (the URL the household head
 * shared). On success, the user is bounced to /login with a message.
 */
@Component({
  selector: 'bms-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder).nonNullable;
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  /** The reset token from the URL query. If missing, we show an error. */
  private tokenSig = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('token'))),
    { initialValue: null as string | null },
  );

  hasToken = computed(() => !!this.tokenSig());

  form = this.fb.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: [matchPasswords('new_password', 'confirm_password')] },
  );

  submit(): void {
    const token = this.tokenSig();
    if (!token || this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.auth.resetPassword(token, this.form.value.new_password!).subscribe({
      next: () => {
        this.success.set(true);
        this.saving.set(false);
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Reset failed');
        this.saving.set(false);
      },
    });
  }
}

function matchPasswords(a: string, b: string): ValidatorFn {
  return (group: AbstractControl) => {
    const av = group.get(a)?.value;
    const bv = group.get(b)?.value;
    return av && bv && av !== bv ? { mismatch: true } : null;
  };
}
