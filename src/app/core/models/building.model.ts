import { BaseEntity } from './base-entity.model';

export interface Building extends BaseEntity {
  name: string;
  address: string | null;
  floor_count: number;
}

export interface BuildingCreate {
  name: string;
  address?: string | null;
  floor_count: number;
}

export interface BuildingUpdate {
  name?: string;
  address?: string | null;
  floor_count?: number;
}

export interface FloorList {
  building_id: number;
  floors: number[];
}
