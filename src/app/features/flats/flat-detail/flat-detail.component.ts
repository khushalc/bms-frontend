import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FlatApiService } from '../../../core/services/flat-api.service';
import { FlatMemberApiService } from '../../../core/services/flat-member-api.service';
import { Flat } from '../../../core/models/flat.model';
import { FlatMemberListItem, PasswordResetLink } from '../../../core/models/flat-member.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { MemberFormComponent } from '../members/member-form/member-form.component';

/**
 * Flat detail page. Loads flat + members in parallel and shows both
 * on one screen. Vehicles come embedded in the flat detail response
 * (server-side eager load).
 *
 * Composes MemberFormComponent as a modal so member add/edit doesn't
 * navigate away from this page.
 *
 * `canAddMember` mirrors the backend's capacity guard so the "Add
 * member" button disables at the limit (server rejects too, but this
 * saves a roundtrip).
 */
@Component({
  selector: 'bms-flat-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective, MemberFormComponent],
  templateUrl: './flat-detail.component.html',
  styleUrl: './flat-detail.component.scss',
})
export class FlatDetailComponent implements OnInit {
  private flatApi = inject(FlatApiService);
  private memberApi = inject(FlatMemberApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  flat = signal<Flat | null>(null);
  members = signal<FlatMemberListItem[]>([]);

  showMemberForm = signal(false);
  editingMemberId = signal<number | null>(null);

  // Password reset link — populated after generation, cleared on close.
  resetLink = signal<PasswordResetLink | null>(null);
  resetLinkFor = signal<FlatMemberListItem | null>(null);
  copied = signal(false);

  canAddMember = computed(() => {
    const f = this.flat();
    return !!f && this.members().length < f.declared_member_count;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const flatId = Number(this.route.snapshot.paramMap.get('id'));
    if (!flatId) return;
    this.loading.set(true);
    forkJoin({
      flat: this.flatApi.detail(flatId),
      members: this.memberApi.list(flatId),
    }).subscribe({
      next: ({ flat, members }) => {
        this.flat.set(flat);
        this.members.set(members);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load flat');
        this.loading.set(false);
      },
    });
  }

  openAddMember(): void {
    this.editingMemberId.set(null);
    this.showMemberForm.set(true);
  }

  openEditMember(m: FlatMemberListItem): void {
    this.editingMemberId.set(m.id);
    this.showMemberForm.set(true);
  }

  onMemberSaved(): void {
    this.showMemberForm.set(false);
    this.editingMemberId.set(null);
    this.load();
  }

  onMemberCancel(): void {
    this.showMemberForm.set(false);
    this.editingMemberId.set(null);
  }

  removeMember(m: FlatMemberListItem): void {
    if (!confirm(`Remove ${m.first_name} ${m.last_name} from the flat?`)) return;
    this.memberApi.delete(m.flat_id, m.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Delete failed'),
    });
  }

  /**
   * Toggle a member's is_active flag. Server enforces the "family-role
   * only for non-admins" rule and 403s if the actor isn't allowed —
   * we surface the error message inline.
   */
  toggleMemberActive(m: FlatMemberListItem): void {
    const next = !m.is_active;
    const verb = next ? 'Re-enable' : 'Disable';
    if (!confirm(`${verb} ${m.first_name} ${m.last_name}?`)) return;
    this.memberApi.setActive(m.flat_id, m.id, next).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? `${verb} failed`),
    });
  }

  removeVehicle(vehicleId: number): void {
    const f = this.flat();
    if (!f) return;
    if (!confirm('Remove this vehicle?')) return;
    this.flatApi.deleteVehicle(f.id, vehicleId).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'Delete failed'),
    });
  }

  /**
   * Generate a one-time password reset link for a family member. Server
   * gates on admin/committee OR primary/co-applicant of same flat and
   * rejects non-family targets — we surface any rejection inline.
   * The link modal shows the URL + a Copy button; the caller forwards
   * it manually via WhatsApp/SMS.
   */
  generateResetLink(m: FlatMemberListItem): void {
    this.memberApi
      .generatePasswordResetLink(m.flat_id, m.id, window.location.origin)
      .subscribe({
        next: (link) => {
          this.resetLink.set(link);
          this.resetLinkFor.set(m);
          this.copied.set(false);
        },
        error: (err) => alert(err?.error?.message ?? 'Failed to generate link'),
      });
  }

  copyLink(): void {
    const url = this.resetLink()?.url;
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => this.copied.set(true),
      () => alert('Copy failed — please select and copy manually.'),
    );
  }

  closeResetLink(): void {
    this.resetLink.set(null);
    this.resetLinkFor.set(null);
    this.copied.set(false);
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'primary': return 'Primary member';
      case 'co_applicant': return 'Co-applicant';
      case 'family': return 'Family member';
      default: return role;
    }
  }
}
