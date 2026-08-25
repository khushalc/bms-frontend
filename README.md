# bms-frontend

Building Management System — Angular frontend.

## Stack

- **Angular 22** — standalone components, signals, lazy-loaded routes
- **SCSS** styles
- **RxJS** (kept minimal — reactive state via signals)
- **Reactive Forms** for input handling
- Config via a single `.env` → `src/environments/*.ts` (see below)

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
    components/, pipes/   (placeholders for growth)
  features/
    auth/login/     login screen
    dashboard/      post-login shell
    forbidden.component.ts
src/environments/   environment.ts (dev) / .test.ts / .prod.ts — all GENERATED
scripts/
  build-environment.mjs   .env → src/environments/environment*.ts
```

---

## Responsive scope (first-class)

The app targets **both desktop web and mobile devices** — every new
screen/component must ship a responsive layout from day one.

- Mobile-first SCSS (`min-width` breakpoints, not `max-width`).
- Standard breakpoints: `sm ≥ 640px`, `md ≥ 768px`, `lg ≥ 1024px`, `xl ≥ 1280px`.
- Prefer fluid layouts (flex/grid, `clamp()`, relative units) over fixed widths.
- Tap targets ≥ 44×44 px on mobile; avoid hover-only interactions.
- Test at ≤ 375px width and ≥ 1440px before calling a screen done.
- This stays a responsive PWA-style web app — no React Native / Ionic unless explicitly changed.

---

## Prerequisites

- **Node ≥ 24.15.0** (Angular 22 requirement). Recommended: **v26.4.0** (pinned in `.nvmrc`).
- **npm ≥ 10** (bundled with Node ≥ 22).
- The backend API running (see `../bms-backend`) — default: `http://localhost:8000/api/v1`.

Using `nvm`:
```bash
nvm install                             # installs the version in .nvmrc
nvm use                                 # activates it in the current shell
node --version                          # verify: v26.4.0
```

---

## Setup (first time)

```bash
# 1. Ensure the right Node version
nvm use                                 # reads .nvmrc

# 2. Copy env template — this is the ONLY .env file (gitignored)
cp .env.example .env
# edit .env if your API isn't at http://localhost:8000/api/v1

# 3. Install packages
npm install

# 4. Start the dev server (also regenerates src/environments/environment.ts from .env)
npm start
# open http://localhost:4200
```

---

## Everyday commands

### Dev server & build

```bash
npm start                               # env:dev + `ng serve` on http://localhost:4200
npm run build                           # env:prod + production build → dist/bms-frontend
npm run build:dev                       # env:dev  + development build → dist/bms-frontend
npm run watch                           # env:dev  + `ng build --watch --configuration development`
```

Direct Angular CLI (all with `npx` unless you install `@angular/cli` globally):

```bash
npx ng serve --port 4300 --open         # custom port + open browser
npx ng serve --host 0.0.0.0             # expose on LAN (test on mobile via your machine's IP)
npx ng build --configuration development
npx ng build --configuration production
npx ng build --configuration test       # uses fileReplacements → environment.test.ts
```

### Environment script (`scripts/build-environment.mjs`)

```bash
npm run env:dev                         # writes src/environments/environment.ts       (production=false)
npm run env:test                        # writes src/environments/environment.test.ts  (production=false)
npm run env:prod                        # writes src/environments/environment.prod.ts  (production=true)
```

All three read from the **single** `.env` file. `npm start` / `npm test` /
`npm run build` run the right `env:*` step automatically via `pre*` hooks.

Whitelist of env vars (see `scripts/build-environment.mjs`):

| .env key       | environment key | required |
| -------------- | --------------- | -------- |
| `API_BASE_URL` | `apiBaseUrl`    | yes      |
| `APP_NAME`     | `appName`       | no       |

Values are **baked into the client bundle at build time**. Never put secrets in
`.env` — everything ships to the browser.

> ⚠️ The generated `src/environments/environment*.ts` files are **gitignored**
> (each dev's `.env` values would otherwise leak into commits). `npm start`,
> `npm run build`, and `npm test` regenerate them automatically via their
> pre-scripts. If you invoke `npx ng build` / `npx ng serve` directly (bypassing
> npm scripts), run `npm run env:dev` (or `env:test` / `env:prod`) once first
> so `environment.ts` exists.

### Tests

```bash
npm test                                # env:test + `ng test` (Vitest under Angular 22)
npx ng test --watch=false               # single run, non-interactive
```

### Angular CLI generators

```bash
npx ng generate component features/buildings/building-list --standalone
npx ng generate service core/services/notification
npx ng generate guard core/guards/admin
npx ng generate pipe shared/pipes/relative-time
npx ng generate directive shared/directives/click-outside

# Aliases: g c, g s, g g, g p, g d
npx ng g c features/buildings/building-form
```

### Housekeeping

```bash
rm -rf dist .angular/cache              # clean build artifacts + Angular cache
rm -rf node_modules package-lock.json && npm install    # full reinstall
npx ng version                          # show Angular + tooling versions
```

---

## Adding a new feature module (e.g. `buildings`)

1. **Model** — `src/app/core/models/building.model.ts`:
   ```ts
   import { BaseEntity } from './base-entity.model';
   export interface Building extends BaseEntity { name: string; address: string; }
   ```

2. **API service** — extend `BaseApiService`:
   ```ts
   @Injectable({ providedIn: 'root' })
   export class BuildingApiService extends BaseApiService<Building> {
     protected resource = 'buildings';
   }
   ```

3. **Feature component** — `ng g c features/buildings/building-list --standalone` and use `BuildingApiService`.

4. **Route** — add to `src/app/app.routes.ts`, gated by permission:
   ```ts
   {
     path: 'buildings',
     canActivate: [authGuard, permissionGuard('building.read')],
     loadComponent: () => import('./features/buildings/building-list/building-list.component')
       .then(m => m.BuildingListComponent),
   }
   ```

5. **Template gate** — hide/show controls with `*hasPermission`:
   ```html
   <button *hasPermission="'building.write'">New building</button>
   ```

6. **Responsive** — write SCSS mobile-first; verify at ≤ 375px and ≥ 1440px.

---

## Auth flow (recap)

1. `POST /auth/login` via `AuthService.login()` — tokens land in `localStorage`.
2. `authInterceptor` attaches `Authorization: Bearer <access>` to every request.
3. `AuthService.loadMe()` populates the `me` signal + permission set.
4. Templates gate on `*hasPermission="'key'"`; routes gate on `permissionGuard('key')`.
5. On 401 the `errorInterceptor` clears storage and bounces to `/login`.

---

## Environment variables (`.env`)

| Variable       | Default                              | Description                                     |
| -------------- | ------------------------------------ | ----------------------------------------------- |
| `API_BASE_URL` | `http://localhost:8000/api/v1`       | Backend base URL (required)                     |
| `APP_NAME`     | `bms-frontend`                       | Shown in title bars, etc.                       |

For a prod build with different values (e.g. an absolute API URL, a different
`APP_NAME`), populate `.env` with the prod values before running
`npm run build`, or let CI do that swap.

---

## Testing on a real mobile device (same LAN)

```bash
npx ng serve --host 0.0.0.0 --port 4200
# find your machine's IP: `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux)
# on phone browser: http://<your-ip>:4200
```

If the API is on the same machine, set `API_BASE_URL=http://<your-ip>:8000/api/v1`
in `.env`, then `npm run env:dev` and refresh.

---

## Troubleshooting

**`Node.js version vXX.X.X detected. The Angular CLI requires ...`**
- Run `nvm use` (reads `.nvmrc` → v26.4.0). If nvm isn't installed, upgrade Node from https://nodejs.org/.

**`Missing required env key: API_BASE_URL`**
- Your `.env` doesn't define `API_BASE_URL`. `cp .env.example .env` and edit.

**Blank page / `net::ERR_CONNECTION_REFUSED` on `/api/v1/*`**
- Backend not running. Start it: `cd ../bms-backend && uvicorn app.main:app --reload`.
- Or `API_BASE_URL` is wrong in `.env` — fix it and `npm run env:dev` to regenerate.

**CORS error in browser console**
- Add your Angular origin (e.g. `http://localhost:4200`) to `CORS_ORIGINS` in `bms-backend/.env` and restart the API.

**`Property 'foo' has no initializer …` after upgrading TS**
- Set `"strictPropertyInitialization": false` OR use definite assignment (`foo!: string`) — check `tsconfig.json`.

**Bundle size warning on prod build**
- Adjust budgets in `angular.json` → `configurations.production.budgets`.
