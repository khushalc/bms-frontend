import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  FlatMember,
  FlatMemberCreate,
  FlatMemberListItem,
  FlatMemberUpdate,
  UploadedFile,
} from '../models/flat-member.model';
import { BaseService } from './base.service';

/**
 * Flat-member CRUD + committee-letter upload.
 *
 * Doesn't extend BaseApiService because members live under the
 * `/flats/{flatId}/members` nested path, not a simple `/members` root —
 * the base's `resource` pattern would need every method overridden anyway.
 * Instead extends BaseService for the standard `http` / `config` refs.
 */
@Injectable({ providedIn: 'root' })
export class FlatMemberApiService extends BaseService {
  /** Compute the per-flat members endpoint base URL. */
  private base(flatId: number): string {
    return `${this.config.baseUrl}/flats/${flatId}/members`;
  }

  /**
   * List members for a flat. Server masks mobile/email in this response —
   * detail endpoint below returns them unmasked.
   */
  list(flatId: number): Observable<FlatMemberListItem[]> {
    return this.http.get<FlatMemberListItem[]>(this.base(flatId));
  }

  /** Full member detail (unmasked mobile/email). */
  get(flatId: number, memberId: number): Observable<FlatMember> {
    return this.http.get<FlatMember>(`${this.base(flatId)}/${memberId}`);
  }

  /**
   * Create a member. `payload.create_user=true` + user_password triggers
   * inline user creation with the FlatMember role only (backend enforces).
   */
  create(flatId: number, payload: FlatMemberCreate): Observable<FlatMember> {
    return this.http.post<FlatMember>(this.base(flatId), payload);
  }

  /** Partial update. Toggling is_committee_member also syncs the
   *  Committee role on the linked user (server-side). */
  update(flatId: number, memberId: number, payload: FlatMemberUpdate): Observable<FlatMember> {
    return this.http.patch<FlatMember>(`${this.base(flatId)}/${memberId}`, payload);
  }

  /**
   * PATCH /flats/{flatId}/members/{memberId}/active — toggle the
   * soft-disable flag. Distinct from delete: the row stays visible in
   * listings but is greyed out. Server enforces the "family-role only
   * for non-admins" rule and returns 403 otherwise.
   */
  setActive(flatId: number, memberId: number, isActive: boolean): Observable<FlatMember> {
    return this.http.patch<FlatMember>(
      `${this.base(flatId)}/${memberId}/active`,
      { is_active: isActive },
    );
  }

  /** Soft-delete. Linked user account is NOT deleted. */
  delete(flatId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.base(flatId)}/${memberId}`);
  }

  /**
   * Upload a committee letter (PDF/PNG/JPG) and get back the
   * `relative_path` to stash in `FlatMember.committee_letter_path`.
   * Required before saving a family member with is_committee_member=true.
   */
  uploadCommitteeLetter(file: File): Observable<UploadedFile> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadedFile>(`${this.config.baseUrl}/files/committee-letters`, form);
  }
}
