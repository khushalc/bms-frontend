import { Injectable } from '@angular/core';

import { BaseEntity } from '../models/base-entity.model';
import { BaseApiService } from './base-api.service';

/**
 * Slim role shape embedded in Permission responses so the admin UI can
 * render "Used by <role chips>" without a second request per permission.
 */
export interface RoleSummary {
  id: number;
  name: string;
  is_system: boolean;
}

/**
 * Permission response shape. `roles` is populated by the /permissions
 * endpoints only — when a permission is nested inside RoleRead
 * (elsewhere) the backend uses a slim shape without `roles` to avoid
 * a Role → Permission → Role serialization loop.
 */
export interface Permission extends BaseEntity {
  key: string;
  name: string;
  description: string | null;
  is_custom: boolean;
  roles: RoleSummary[];
}

/**
 * Body for POST /permissions. Rarely used from the UI — the frontend
 * hides "New permission" because permissions are seeded from
 * `seeds/permissions.py`.
 */
export interface PermissionCreate {
  key: string;
  name: string;
  description?: string | null;
  is_custom?: boolean;
}

/**
 * Body for PATCH /permissions/{id}. Only name/description are editable —
 * key and is_custom are locked in the UI's edit form.
 */
export interface PermissionUpdate {
  name?: string;
  description?: string | null;
}

/** CRUD client for /permissions. Inherits list/get/create/update/delete. */
@Injectable({ providedIn: 'root' })
export class PermissionApiService extends BaseApiService<Permission, PermissionCreate, PermissionUpdate> {
  protected resource = 'permissions';
}
