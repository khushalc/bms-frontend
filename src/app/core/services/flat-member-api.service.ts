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

@Injectable({ providedIn: 'root' })
export class FlatMemberApiService extends BaseService {
  private base(flatId: number): string {
    return `${this.config.baseUrl}/flats/${flatId}/members`;
  }

  list(flatId: number): Observable<FlatMemberListItem[]> {
    return this.http.get<FlatMemberListItem[]>(this.base(flatId));
  }

  get(flatId: number, memberId: number): Observable<FlatMember> {
    return this.http.get<FlatMember>(`${this.base(flatId)}/${memberId}`);
  }

  create(flatId: number, payload: FlatMemberCreate): Observable<FlatMember> {
    return this.http.post<FlatMember>(this.base(flatId), payload);
  }

  update(flatId: number, memberId: number, payload: FlatMemberUpdate): Observable<FlatMember> {
    return this.http.patch<FlatMember>(`${this.base(flatId)}/${memberId}`, payload);
  }

  delete(flatId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.base(flatId)}/${memberId}`);
  }

  uploadCommitteeLetter(file: File): Observable<UploadedFile> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadedFile>(`${this.config.baseUrl}/files/committee-letters`, form);
  }
}
