import { BaseEntity } from './base-entity.model';

export interface Permission extends BaseEntity {
  key: string;
  name: string;
  description?: string | null;
  is_custom: boolean;
}

export interface Role extends BaseEntity {
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: Permission[];
}

export interface User extends BaseEntity {
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  roles: Role[];
}

export interface Me extends User {
  permissions: string[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
