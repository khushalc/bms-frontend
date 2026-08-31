import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Flat, FlatCreate, FlatUpdate } from '../models/flat.model';
import { Vehicle, VehicleCreate, VehicleUpdate } from '../models/vehicle.model';
import { BaseApiService } from './base-api.service';

/**
 * Flat CRUD (inherited from BaseApiService) + nested vehicle endpoints.
 *
 * The nested vehicle methods live here (instead of a separate
 * VehicleApiService) because vehicles have no top-level list — they're
 * always addressed through a flat and gated by flat access on the
 * backend.
 */
@Injectable({ providedIn: 'root' })
export class FlatApiService extends BaseApiService<Flat, FlatCreate, FlatUpdate> {
  protected resource = 'flats';

  /**
   * GET /flats/{id}/detail — a flat with vehicles + members eagerly
   * loaded (and `member_count` set from the server-side count).
   * Prefer this over `.get()` when the caller needs the children.
   */
  detail(flatId: number): Observable<Flat> {
    return this.http.get<Flat>(`${this.url}/${flatId}/detail`);
  }

  /** GET /flats/{id}/vehicles — flat vehicle list. */
  listVehicles(flatId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.url}/${flatId}/vehicles`);
  }

  /** POST /flats/{id}/vehicles — attach a vehicle to a flat. */
  addVehicle(flatId: number, payload: VehicleCreate): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.url}/${flatId}/vehicles`, payload);
  }

  /** PATCH /flats/{id}/vehicles/{vid} — partial update. */
  updateVehicle(flatId: number, vehicleId: number, payload: VehicleUpdate): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.url}/${flatId}/vehicles/${vehicleId}`, payload);
  }

  /** DELETE /flats/{id}/vehicles/{vid} — soft-delete. */
  deleteVehicle(flatId: number, vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${flatId}/vehicles/${vehicleId}`);
  }
}
