import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Building, BuildingCreate, BuildingUpdate, FloorList } from '../models/building.model';
import { BaseApiService } from './base-api.service';

/**
 * Buildings CRUD (from BaseApiService) + the `/floors` helper used
 * by the flat form's floor dropdown.
 */
@Injectable({ providedIn: 'root' })
export class BuildingApiService extends BaseApiService<Building, BuildingCreate, BuildingUpdate> {
  protected resource = 'buildings';

  /**
   * GET /buildings/{id}/floors — server-computed [1..floor_count].
   * Server owns the range so changes to numbering convention (add a
   * ground floor 0, basement -1, etc.) don't need a client change.
   */
  floors(buildingId: number): Observable<FloorList> {
    return this.http.get<FloorList>(`${this.url}/${buildingId}/floors`);
  }
}
