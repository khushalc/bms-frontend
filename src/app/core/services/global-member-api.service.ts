import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginatedResponse } from '../models/base-entity.model';
import { MemberRole } from '../models/flat-member.model';
import { BaseService } from './base.service';

/**
 * Row shape for the cross-flat /members admin list. Extends the
 * per-flat member list item with the flat+building context needed
 * to render "Rose Garden · A-201 · Sharma" without extra roundtrips.
 * Mobile and email arrive already masked by the server.
 */
export interface GlobalMemberListItem {
  id: number;
  flat_id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  age: number;
  mobile: string; // masked
  email: string | null; // masked
  role: MemberRole;
  is_committee_member: boolean;
  created_at: string;
  updated_at: string;
  flat_number: string;
  flat_floor: number;
  building_id: number;
  building_name: string;
  building_number: string;
}

/**
 * Server-side query params for the global members list.
 * All optional; the backend ANDs the filters.
 */
export interface GlobalMemberQuery {
  page?: number;
  page_size?: number;
  /** ILIKE across first/last name, flat number, flat name, building name/number. */
  search?: string;
  building_id?: number;
  role?: MemberRole;
  is_committee_member?: boolean;
}

/**
 * Client for the cross-flat /members admin endpoint. Server-side
 * pagination + filtering — the list page passes user filters through
 * and re-fetches on change (no client-side filter).
 */
@Injectable({ providedIn: 'root' })
export class GlobalMemberApiService extends BaseService {
  /**
   * GET /members with optional query params. Undefined/null/empty values
   * are dropped so the caller can pass a sparse object.
   */
  list(q: GlobalMemberQuery = {}): Observable<PaginatedResponse<GlobalMemberListItem>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(q)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return this.http.get<PaginatedResponse<GlobalMemberListItem>>(
      `${this.config.baseUrl}/members`,
      { params },
    );
  }
}
