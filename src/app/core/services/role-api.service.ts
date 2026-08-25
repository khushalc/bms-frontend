import { Injectable } from '@angular/core';

import { BaseEntity } from '../models/base-entity.model';
import { Permission } from './permission-api.service';
import { BaseApiService } from './base-api.service';

export interface Role extends BaseEntity {
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  description?: string | null;
  permission_ids?: number[];
}

export interface RoleUpdate {
  name?: string;
  description?: string | null;
  permission_ids?: number[];
}

@Injectable({ providedIn: 'root' })
export class RoleApiService extends BaseApiService<Role, RoleCreate, RoleUpdate> {
  protected resource = 'roles';
}
