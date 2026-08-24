import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { BaseEntity, PageParams, PaginatedResponse } from '../models/base-entity.model';

/**
 * Generic CRUD client for a REST resource that matches the backend's
 * BaseRouter conventions (list/get/create/update/delete + pagination).
 *
 * Usage:
 *   @Injectable({ providedIn: 'root' })
 *   export class BuildingApiService extends BaseApiService<Building, BuildingCreate, BuildingUpdate> {
 *     protected resource = 'buildings';
 *   }
 */
export abstract class BaseApiService<
  T extends BaseEntity,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> {
  protected http = inject(HttpClient);
  protected config = inject(API_CONFIG);

  protected abstract resource: string;

  protected get url(): string {
    return `${this.config.baseUrl}/${this.resource}`;
  }

  list(params: PageParams = {}): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        httpParams = httpParams.set(k, String(v));
      }
    }
    return this.http.get<PaginatedResponse<T>>(this.url, { params: httpParams });
  }

  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(payload: CreateDto): Observable<T> {
    return this.http.post<T>(this.url, payload);
  }

  update(id: number, payload: UpdateDto): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
