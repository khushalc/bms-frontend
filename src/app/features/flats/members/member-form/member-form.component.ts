import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { FlatMemberApiService } from '../../../../core/services/flat-member-api.service';
import {
  FlatMemberCreate,
  FlatMemberUpdate,
  MemberRole,
} from '../../../../core/models/flat-member.model';

/**
 * Modal form used by FlatDetailComponent to create / edit a FlatMember.
 * Emits `saved` on success (parent closes + reloads) or `cancelled`.
 *
 * Cross-field UX (mirrors backend validation):
 *   - `letterRequired` (family + committee): reveals the file upload;
 *     Save is blocked until upload succeeds.
 *   - In create mode, `create_user=true` reveals a password field and
 *     the backend mints a User bound to this member with the FlatMember
 *     role only (never admin).
 *   - In edit mode, the create-user affordance is disabled because the
 *     linked User can't be recreated here.
 */
@Component({
  selector: 'bms-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './member-form.component.html',
  styleUrl: './member-form.component.scss',
})
export class MemberFormComponent implements OnInit {
  @Input({ required: true }) flatId!: number;
  @Input() memberId: number | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder).nonNullable;
  private api = inject(FlatMemberApiService);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  uploadedPath = signal<string | null>(null);
  uploading = signal(false);
  isEdit = computed(() => this.memberId !== null);

  form = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
    age: [18, [Validators.required, Validators.min(0), Validators.max(130)]],
    mobile: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    email: ['' as string | null, [Validators.email]],
    role: ['family' as MemberRole, Validators.required],
    is_committee_member: [false],
    create_user: [false],
    user_password: [''],
  });

  private roleSig = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });
  private committeeSig = toSignal(this.form.controls.is_committee_member.valueChanges, {
    initialValue: this.form.controls.is_committee_member.value,
  });

  /** Letter is required when a family member joins the committee. */
  letterRequired = computed(
    () => this.roleSig() === 'family' && !!this.committeeSig(),
  );

  constructor() {
    effect(() => {
      const need = this.letterRequired();
      if (!need) this.uploadedPath.set(null);
    });
  }

  ngOnInit(): void {
    if (this.memberId) {
      this.loading.set(true);
      this.api.get(this.flatId, this.memberId).subscribe({
        next: (m) => {
          this.form.patchValue({
            first_name: m.first_name,
            last_name: m.last_name,
            age: m.age,
            mobile: m.mobile,
            email: m.email ?? '',
            role: m.role,
            is_committee_member: m.is_committee_member,
          });
          this.uploadedPath.set(m.committee_letter_path);
          // hide user-creation options in edit mode
          this.form.controls.create_user.disable();
          this.form.controls.user_password.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    this.api.uploadCommitteeLetter(file).subscribe({
      next: (res) => {
        this.uploadedPath.set(res.relative_path);
        this.uploading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Upload failed');
        this.uploading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    if (this.letterRequired() && !this.uploadedPath()) {
      this.error.set('Committee letter is required for a family member on the committee.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();

    if (this.isEdit()) {
      const payload: FlatMemberUpdate = {
        first_name: v.first_name,
        last_name: v.last_name,
        age: v.age,
        mobile: v.mobile,
        email: v.email || null,
        role: v.role,
        is_committee_member: v.is_committee_member,
        committee_letter_path: this.uploadedPath(),
      };
      this.api.update(this.flatId, this.memberId!, payload).subscribe({
        next: () => this.saved.emit(),
        error: (err) => this._onErr(err),
      });
    } else {
      const payload: FlatMemberCreate = {
        first_name: v.first_name,
        last_name: v.last_name,
        age: v.age,
        mobile: v.mobile,
        email: v.email || null,
        role: v.role,
        is_committee_member: v.is_committee_member,
        committee_letter_path: this.uploadedPath(),
        create_user: v.create_user,
        user_password: v.create_user ? v.user_password : undefined,
      };
      this.api.create(this.flatId, payload).subscribe({
        next: () => this.saved.emit(),
        error: (err) => this._onErr(err),
      });
    }
  }

  private _onErr(err: unknown): void {
    const msg =
      (err as { error?: { message?: string } })?.error?.message ?? 'Save failed';
    this.error.set(msg);
    this.saving.set(false);
  }
}
