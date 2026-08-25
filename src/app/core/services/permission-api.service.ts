import { Injectable } from '@angular/core';

import { BaseEntity } from '../models/base-entity.model';
import { BaseApiService } from './base-api.service';

export interface Permission extends BaseEntity {
  key: string;
  name: string;
  description: string | null;
  is_custom: boolean;
}

export interface PermissionCreate {
  key: string;
  name: string;
  description?: string | null;
  is_custom?: boolean;
}

export interface PermissionUpdate {
  name?: string;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PermissionApiService extends BaseApiService<Permission, PermissionCreate, PermissionUpdate> {
  protected resource = 'permissions';
}
