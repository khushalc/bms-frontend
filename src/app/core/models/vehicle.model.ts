import { BaseEntity } from './base-entity.model';

/** Polymorphic vehicle tag. Extend as `'ev' | 'scooter'` when needed. */
export type VehicleType = 'car' | 'bike';

/**
 * A vehicle attached to a flat. `number` is the license plate;
 * `model` and `brand` are optional.
 */
export interface Vehicle extends BaseEntity {
  flat_id: number;
  type: VehicleType;
  number: string;
  model: string | null;
  brand: string | null;
}

/** Body for creating a vehicle. `flat_id` comes from the URL, not the body. */
export interface VehicleCreate {
  type: VehicleType;
  number: string;
  model?: string | null;
  brand?: string | null;
}

/** Body for PATCH — type is immutable (delete + recreate to change type). */
export interface VehicleUpdate {
  number?: string;
  model?: string | null;
  brand?: string | null;
}
