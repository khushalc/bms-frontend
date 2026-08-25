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

  // Everything authed lives inside the AppShell (sidenav + toolbar).
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      // Buildings
      {
        path: 'buildings',
        canActivate: [permissionGuard('building.read')],
        loadComponent: () =>
          import('./features/buildings/building-list/building-list.component').then(
            (m) => m.BuildingListComponent,
          ),
      },
      {
        path: 'buildings/new',
        canActivate: [permissionGuard('building.write')],
        loadComponent: () =>
          import('./features/buildings/building-form/building-form.component').then(
            (m) => m.BuildingFormComponent,
          ),
      },
      {
        path: 'buildings/:id/edit',
        canActivate: [permissionGuard('building.write')],
        loadComponent: () =>
          import('./features/buildings/building-form/building-form.component').then(
            (m) => m.BuildingFormComponent,
          ),
      },

      // Flats
      {
        path: 'flats',
        canActivate: [permissionGuard('flat.read')],
        loadComponent: () =>
          import('./features/flats/flat-list/flat-list.component').then((m) => m.FlatListComponent),
      },
      {
        path: 'flats/new',
        canActivate: [permissionGuard('flat.write')],
        loadComponent: () =>
          import('./features/flats/flat-form/flat-form.component').then((m) => m.FlatFormComponent),
      },
      {
        path: 'flats/:id/edit',
        canActivate: [permissionGuard('flat.write')],
        loadComponent: () =>
          import('./features/flats/flat-form/flat-form.component').then((m) => m.FlatFormComponent),
      },
      {
        path: 'flats/:id',
        canActivate: [permissionGuard('flat.read')],
        loadComponent: () =>
          import('./features/flats/flat-detail/flat-detail.component').then(
            (m) => m.FlatDetailComponent,
          ),
      },

      // Members (cross-flat listing)
      {
        path: 'members',
        canActivate: [permissionGuard('member.read')],
        loadComponent: () =>
          import('./features/members/member-global-list.component').then(
            (m) => m.MemberGlobalListComponent,
          ),
      },

      // Roles
      {
        path: 'roles',
        canActivate: [permissionGuard('role.read')],
        loadComponent: () =>
          import('./features/roles/role-list/role-list.component').then((m) => m.RoleListComponent),
      },
      {
        path: 'roles/new',
        canActivate: [permissionGuard('role.write')],
        loadComponent: () =>
          import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
      },
      {
        path: 'roles/:id/edit',
        canActivate: [permissionGuard('role.write')],
        loadComponent: () =>
          import('./features/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
      },

      // Permissions
      {
        path: 'permissions',
        canActivate: [permissionGuard('permission.read')],
        loadComponent: () =>
          import('./features/permissions/permission-list/permission-list.component').then(
            (m) => m.PermissionListComponent,
          ),
      },
      // /permissions/new is intentionally omitted — permissions are seeded
      // from code (seeds/permissions.py) when a new route/endpoint is added.
      {
        path: 'permissions/:id/edit',
        canActivate: [permissionGuard('permission.write')],
        loadComponent: () =>
          import('./features/permissions/permission-form/permission-form.component').then(
            (m) => m.PermissionFormComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
