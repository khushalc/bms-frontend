import { Injectable } from '@angular/core';

import { BaseEntity } from '../models/base-entity.model';
import { Permission } from './permission-api.service';
import { BaseApiService } from './base-api.service';

/**
 * Role response shape. `permissions` uses the same Permission interface
 * as PermissionApiService — in practice the server drops `roles` when
 * a Permission is nested inside a Role response (breaks the
 * Role → Permission → Role serialization loop), but our TS types
 * treat them as one shape for simplicity.
 */
export interface Role extends BaseEntity {
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
}

/**
 * Body for POST /roles. `permission_ids` picks the initial permission
 * set — empty list means a role that grants nothing.
 */
export interface RoleCreate {
  name: string;
  description?: string | null;
  permission_ids?: number[];
}

/**
 * Body for PATCH /roles/{id}. `permission_ids=undefined` leaves the set
 * unchanged; `[]` clears it. System roles can't rename (server rejects).
 */
export interface RoleUpdate {
  name?: string;
  description?: string | null;
  permission_ids?: number[];
}

/** CRUD client for /roles. */
@Injectable({ providedIn: 'root' })
export class RoleApiService extends BaseApiService<Role, RoleCreate, RoleUpdate> {
  protected resource = 'roles';
}
