import { BaseEntity } from './base-entity.model';
import { Vehicle, VehicleCreate } from './vehicle.model';

/**
 * A flat (unit) in a building. `declared_member_count` is enforced —
 * the backend rejects a new member when the flat is at capacity.
 * `member_count` is server-set (via a Flat.member_count property);
 * treat it as read-only in the client.
 */
export interface Flat extends BaseEntity {
  building_id: number;
  floor: number;
  number: string;
  name_on_board: string | null;
  declared_member_count: number;
  vehicles: Vehicle[];
  member_count: number;
}

/**
 * Body for POST /flats. Optional initial `vehicles` list lets the new-flat
 * form register cars/bikes in one request. Members are added separately.
 */
export interface FlatCreate {
  building_id: number;
  floor: number;
  number: string;
  name_on_board?: string | null;
  declared_member_count: number;
  vehicles?: VehicleCreate[];
}

/** Body for PATCH. `building_id` is intentionally not editable. */
export interface FlatUpdate {
  floor?: number;
  number?: string;
  name_on_board?: string | null;
  declared_member_count?: number;
}
