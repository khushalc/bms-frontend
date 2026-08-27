import { BaseEntity } from './base-entity.model';

/**
 * Member's relationship to the household. Drives two rules:
 *   - `family` + committee → `committee_letter_path` required
 *   - flat_members creating users inline can only mint FlatMember-role users
 */
export type MemberRole = 'primary' | 'co_applicant' | 'family';

/**
 * Full member detail — unmasked mobile/email. Returned by the
 * detail endpoint to authorized viewers.
 */
export interface FlatMember extends BaseEntity {
  flat_id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  age: number;
  mobile: string;
  email: string | null;
  role: MemberRole;
  is_committee_member: boolean;
  committee_letter_path: string | null;
}

/** Listing shape — mobile/email are already masked by the server. */
export interface FlatMemberListItem extends BaseEntity {
  flat_id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  age: number;
  mobile: string;
  email: string | null;
  role: MemberRole;
  is_committee_member: boolean;
}

/**
 * Body for POST /flats/{id}/members. `create_user=true` + user_password
 * triggers inline user creation (backend forces FlatMember role).
 * `committee_letter_path` is required by the backend when
 * `is_committee_member=true` AND `role='family'`.
 */
export interface FlatMemberCreate {
  first_name: string;
  last_name: string;
  age: number;
  mobile: string;
  email?: string | null;
  role: MemberRole;
  is_committee_member?: boolean;
  committee_letter_path?: string | null;
  create_user?: boolean;
  user_password?: string;
}

/**
 * Body for PATCH. All fields optional — omitted keys keep their DB
 * value. Toggling is_committee_member on/off also syncs the Committee
 * role on the linked user (server-side).
 */
export interface FlatMemberUpdate {
  first_name?: string;
  last_name?: string;
  age?: number;
  mobile?: string;
  email?: string | null;
  role?: MemberRole;
  is_committee_member?: boolean;
  committee_letter_path?: string | null;
}

/**
 * Response from POST /files/committee-letters. `relative_path` is what
 * gets stored on FlatMember.committee_letter_path.
 */
export interface UploadedFile {
  relative_path: string;
  subdir: string;
  filename: string;
  size: number;
}
