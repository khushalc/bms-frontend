import { BaseEntity } from './base-entity.model';

export type VehicleType = 'car' | 'bike';

export interface Vehicle extends BaseEntity {
  flat_id: number;
  type: VehicleType;
  number: string;
  model: string | null;
  brand: string | null;
}

export interface VehicleCreate {
  type: VehicleType;
  number: string;
  model?: string | null;
  brand?: string | null;
}

export interface VehicleUpdate {
  number?: string;
  model?: string | null;
  brand?: string | null;
}
