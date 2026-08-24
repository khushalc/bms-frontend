import { BaseEntity } from './base-entity.model';

export type MemberRole = 'primary' | 'co_applicant' | 'family';

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

export interface UploadedFile {
  relative_path: string;
  subdir: string;
  filename: string;
  size: number;
}
