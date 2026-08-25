import { BaseEntity } from './base-entity.model';

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

export interface FloorList {
  building_id: number;
  floors: number[];
}
