import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },

  // Buildings
  {
    path: 'buildings',
    canActivate: [authGuard, permissionGuard('building.read')],
    loadComponent: () =>
      import('./features/buildings/building-list/building-list.component').then(
        (m) => m.BuildingListComponent,
      ),
  },
  {
    path: 'buildings/new',
    canActivate: [authGuard, permissionGuard('building.write')],
    loadComponent: () =>
      import('./features/buildings/building-form/building-form.component').then(
        (m) => m.BuildingFormComponent,
      ),
  },
  {
    path: 'buildings/:id/edit',
    canActivate: [authGuard, permissionGuard('building.write')],
    loadComponent: () =>
      import('./features/buildings/building-form/building-form.component').then(
        (m) => m.BuildingFormComponent,
      ),
  },

  // Flats
  {
    path: 'flats',
    canActivate: [authGuard, permissionGuard('flat.read')],
    loadComponent: () =>
      import('./features/flats/flat-list/flat-list.component').then((m) => m.FlatListComponent),
  },
  {
    path: 'flats/new',
    canActivate: [authGuard, permissionGuard('flat.write')],
    loadComponent: () =>
      import('./features/flats/flat-form/flat-form.component').then((m) => m.FlatFormComponent),
  },
  {
    path: 'flats/:id/edit',
    canActivate: [authGuard, permissionGuard('flat.write')],
    loadComponent: () =>
      import('./features/flats/flat-form/flat-form.component').then((m) => m.FlatFormComponent),
  },
  {
    path: 'flats/:id',
    canActivate: [authGuard, permissionGuard('flat.read')],
    loadComponent: () =>
      import('./features/flats/flat-detail/flat-detail.component').then(
        (m) => m.FlatDetailComponent,
      ),
  },

  // Roles
  {
    path: 'roles',
    canActivate: [authGuard, permissionGuard('role.read')],
    loadComponent: () =>
      import('./features/roles/role-list/role-list.component').then((m) => m.RoleListComponent),
  },
  {
    path: 'roles/new',
    canActivate: [authGuard, permissionGuard('role.write')],
    loadComponent: () =>
      import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
  },
  {
    path: 'roles/:id/edit',
    canActivate: [authGuard, permissionGuard('role.write')],
    loadComponent: () =>
      import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
  },

  // Permissions
  {
    path: 'permissions',
    canActivate: [authGuard, permissionGuard('permission.read')],
    loadComponent: () =>
      import('./features/permissions/permission-list/permission-list.component').then(
        (m) => m.PermissionListComponent,
      ),
  },
  {
    path: 'permissions/new',
    canActivate: [authGuard, permissionGuard('permission.write')],
    loadComponent: () =>
      import('./features/permissions/permission-form/permission-form.component').then(
        (m) => m.PermissionFormComponent,
      ),
  },
  {
    path: 'permissions/:id/edit',
    canActivate: [authGuard, permissionGuard('permission.write')],
    loadComponent: () =>
      import('./features/permissions/permission-form/permission-form.component').then(
        (m) => m.PermissionFormComponent,
      ),
  },

  { path: '**', redirectTo: '' },
];
