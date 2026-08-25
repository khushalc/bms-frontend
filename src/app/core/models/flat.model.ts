import { BaseEntity } from './base-entity.model';
import { Vehicle, VehicleCreate } from './vehicle.model';

export interface Flat extends BaseEntity {
  building_id: number;
  floor: number;
  number: string;
  name_on_board: string | null;
  declared_member_count: number;
  vehicles: Vehicle[];
  member_count: number;
}

export interface FlatCreate {
  building_id: number;
  floor: number;
  number: string;
  name_on_board?: string | null;
  declared_member_count: number;
  vehicles?: VehicleCreate[];
}

export interface FlatUpdate {
  floor?: number;
  number?: string;
  name_on_board?: string | null;
  declared_member_count?: number;
}
