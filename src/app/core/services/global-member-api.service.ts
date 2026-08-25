import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginatedResponse } from '../models/base-entity.model';
import { MemberRole } from '../models/flat-member.model';
import { BaseService } from './base.service';

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

export interface GlobalMemberQuery {
  page?: number;
  page_size?: number;
  search?: string;
  building_id?: number;
  role?: MemberRole;
  is_committee_member?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GlobalMemberApiService extends BaseService {
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
