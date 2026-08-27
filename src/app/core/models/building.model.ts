import { BaseEntity } from './base-entity.model';

/**
 * A society building (tower / block). `number` is a short display code
 * (e.g. "A", "Tower-2"), distinct from `name`. `floor_count` drives the
 * flat form's floor dropdown; `declared_flat_count` is planned capacity
 * (not enforced).
 */
export interface Building extends BaseEntity {
  name: string;
  number: string;
  address: string | null;
  floor_count: number;
  declared_flat_count: number;
  gst_number: string | null;
  mahada_bmc_registration_number: string | null;
  has_gym: boolean;
  has_swimming_pool: boolean;
}

/** Body for POST /buildings. */
export interface BuildingCreate {
  name: string;
  number: string;
  address?: string | null;
  floor_count: number;
  declared_flat_count?: number;
  gst_number?: string | null;
  mahada_bmc_registration_number?: string | null;
  has_gym?: boolean;
  has_swimming_pool?: boolean;
}

/** Body for PATCH — all fields optional. */
export interface BuildingUpdate {
  name?: string;
  number?: string;
  address?: string | null;
  floor_count?: number;
  declared_flat_count?: number;
  gst_number?: string | null;
  mahada_bmc_registration_number?: string | null;
  has_gym?: boolean;
  has_swimming_pool?: boolean;
}

/**
 * Response for GET /buildings/{id}/floors — the valid floor numbers for
 * the flat form dropdown. Server owns the range so conventions can
 * change without a client update.
 */
export interface FloorList {
  building_id: number;
  floors: number[];
}
