import { BaseEntity } from './base-entity.model';

/**
 * A grantable capability. `key` (e.g. "building.write") is what
 * `hasPermission()` and route guards look up. `is_custom` is a display
 * hint — the UI badges custom permissions.
 */
export interface Permission extends BaseEntity {
  key: string;
  name: string;
  description?: string | null;
  is_custom: boolean;
}

/**
 * A named bundle of permissions. `is_system` roles (superadmin,
 * Committee, FlatMember, Admin) can't be deleted or renamed.
 */
export interface Role extends BaseEntity {
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: Permission[];
}

/**
 * Application user — public shape only (never carries password hash).
 * Superadmin (`is_superadmin=true`) bypasses every permission check.
 */
export interface User extends BaseEntity {
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  roles: Role[];
}

/**
 * /auth/me response — a User with a pre-flattened `permissions` array
 * (list of permission keys). `["*"]` for superadmin, which the frontend
 * hasPermission() treats as grant-all.
 */
export interface Me extends User {
  permissions: string[];
}

/**
 * Response from /auth/login and /auth/refresh — an access + refresh pair.
 * `token_type` is always "bearer" (OAuth2 convention).
 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Body for POST /auth/login. */
export interface LoginRequest {
  email: string;
  password: string;
}
