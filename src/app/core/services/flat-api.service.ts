import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Flat, FlatCreate, FlatUpdate } from '../models/flat.model';
import { Vehicle, VehicleCreate, VehicleUpdate } from '../models/vehicle.model';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class FlatApiService extends BaseApiService<Flat, FlatCreate, FlatUpdate> {
  protected resource = 'flats';

  detail(flatId: number): Observable<Flat> {
    return this.http.get<Flat>(`${this.url}/${flatId}/detail`);
  }

  listVehicles(flatId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.url}/${flatId}/vehicles`);
  }

  addVehicle(flatId: number, payload: VehicleCreate): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.url}/${flatId}/vehicles`, payload);
  }

  updateVehicle(flatId: number, vehicleId: number, payload: VehicleUpdate): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.url}/${flatId}/vehicles/${vehicleId}`, payload);
  }

  deleteVehicle(flatId: number, vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${flatId}/vehicles/${vehicleId}`);
  }
}
