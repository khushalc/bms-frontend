import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseEntity, PageParams, PaginatedResponse } from '../models/base-entity.model';
import { BaseService } from './base.service';

/**
 * Generic CRUD client for a REST resource that matches the backend's
 * BaseRouter conventions (list/get/create/update/delete + pagination).
 *
 * Usage:
 *   @Injectable({ providedIn: 'root' })
 *   export class BuildingApiService extends BaseApiService<Building, BuildingCreate, BuildingUpdate> {
 *     protected resource = 'buildings';
 *   }
 *
 * Inherits `http`, `config`, `storage`, `router` from BaseService.
 */
export abstract class BaseApiService<
  T extends BaseEntity,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> extends BaseService {
  /** Endpoint suffix (e.g. 'buildings', 'flats') — appended to `baseUrl`. */
  protected abstract resource: string;

  /** Full URL to the resource, computed from `baseUrl` and `resource`. */
  protected get url(): string {
    return `${this.config.baseUrl}/${this.resource}`;
  }

  /**
   * Paginated list. `params` accepts arbitrary query params (page,
   * page_size, order_by, filters); undefined/null are dropped so the
   * caller can pass a sparse object safely.
   */
  list(params: PageParams = {}): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        httpParams = httpParams.set(k, String(v));
      }
    }
    return this.http.get<PaginatedResponse<T>>(this.url, { params: httpParams });
  }

  /** Fetch one by id. */
  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  /** POST — create one. */
  create(payload: CreateDto): Observable<T> {
    return this.http.post<T>(this.url, payload);
  }

  /** PATCH — partial update. Backend applies field-level merge semantics. */
  update(id: number, payload: UpdateDto): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}`, payload);
  }

  /** DELETE — soft-delete on the backend. Returns 204 No Content. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
