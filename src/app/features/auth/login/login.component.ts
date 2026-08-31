import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/**
 * Login page. Sits OUTSIDE the AppShell so unauthenticated users see a
 * clean full-page form. On success, loads the user profile via
 * AuthService.loadMe() BEFORE navigating to the returnUrl (or /), so the
 * destination page sees the resolved `me` signal on its first render.
 */
@Component({
  selector: 'bms-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Handle the login form submission.
   *
   * 1. Guard against double-submit while loading.
   * 2. Call auth.login → tokens land in localStorage on success.
   * 3. Chain loadMe() so the `me` signal is populated BEFORE we
   *    navigate; downstream guards on the destination page see the
   *    user on their first check (avoids a flash of /login redirect).
   * 4. On failure, surface the server error message inline.
   */
  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.auth.loadMe().subscribe(() => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
          this.router.navigateByUrl(returnUrl);
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Login failed');
      },
    });
  }
}
