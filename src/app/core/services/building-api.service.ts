import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Building, BuildingCreate, BuildingUpdate, FloorList } from '../models/building.model';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class BuildingApiService extends BaseApiService<Building, BuildingCreate, BuildingUpdate> {
  protected resource = 'buildings';

  floors(buildingId: number): Observable<FloorList> {
    return this.http.get<FloorList>(`${this.url}/${buildingId}/floors`);
  }
}
