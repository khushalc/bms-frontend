# bms-frontend

Building Management System — Angular frontend.

## Stack

- **Angular 22** (standalone components, signals, lazy-loaded routes)
- **SCSS** styles
- **RxJS** (kept minimal — reactive state via signals)
- **Reactive Forms** for input handling
- Config via `.env` files → `src/environments/*.ts` (see below)

## Layout

```
src/app/
  core/
    config/         API_CONFIG injection token
    models/         BaseEntity, PaginatedResponse, User/Role/Permission
    services/       AuthService, StorageService, BaseApiService<T>
    interceptors/   request-id, auth, error
    guards/         authGuard, permissionGuard('key.a', 'key.b')
  shared/
    directives/     *hasPermission
    components/, pipes/  (placeholders for growth)
  features/
    auth/login/     login screen
    dashboard/      post-login shell
    forbidden.component.ts
scripts/
  build-environment.mjs   generates src/environments/environment*.ts from .env files
```

## Env / config

There is **one** `.env` file (gitignored, per-developer). A build script reads
it and generates one of the `src/environments/environment*.ts` files based on
which mode flag you pass — only the destination file and the `production` flag
differ per mode; the `.env` values are the same.

Layout:
- `.env` — **gitignored**, one file per developer/environment
- `.env.example` — committed template with the required keys
- `src/environments/environment.ts` / `environment.test.ts` / `environment.prod.ts` —
  **generated** by `scripts/build-environment.mjs`

Whitelist of vars (see `scripts/build-environment.mjs`):

| .env key       | environment key | required |
| -------------- | --------------- | -------- |
| `API_BASE_URL` | `apiBaseUrl`    | yes      |
| `APP_NAME`     | `appName`       | no       |

Generate manually:
```bash
npm run env:dev    # -> src/environments/environment.ts       (production=false)
npm run env:test   # -> src/environments/environment.test.ts  (production=false)
npm run env:prod   # -> src/environments/environment.prod.ts  (production=true)
```

`npm start` runs `env:dev` first; `npm run build` runs `env:prod` first;
`npm test` runs `env:test` first.

Angular's `fileReplacements` in `angular.json` swaps `environment.ts` for the
right file per build configuration (`production`, `test`).

For a prod build with different values (e.g. absolute API URL), populate `.env`
with the prod values before running `npm run build` (or let CI do that swap).

## Local setup

```bash
cp .env.example .env
# edit .env if your API isn't at http://localhost:8000/api/v1
npm install
npm start
# http://localhost:4200
```

## Extending

For a new resource (e.g. `Building`):

```ts
// core/models/building.model.ts
export interface Building extends BaseEntity { name: string; address: string; }

// features/buildings/building-api.service.ts
@Injectable({ providedIn: 'root' })
export class BuildingApiService extends BaseApiService<Building> {
  protected resource = 'buildings';
}

// route: { path: 'buildings', canActivate: [authGuard, permissionGuard('building.read')], ... }
// template: <button *hasPermission="'building.write'">New</button>
```

## Auth flow

1. `POST /auth/login` via `AuthService.login()` -> tokens stored in `localStorage`
2. `authInterceptor` attaches `Authorization: Bearer <access>` to every request
3. `AuthService.loadMe()` populates the `me` signal + permission set
4. Templates gate on `*hasPermission="'key'"`; routes gate on `permissionGuard('key')`
5. On 401 the `errorInterceptor` clears storage and bounces to `/login`
