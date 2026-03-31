# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## OF Chatter Salary Tracker

Weekly salary tracker for OnlyFans chatters. Multi-user app with Replit Auth (OIDC).

### Features
- **Authentication**: Replit OIDC login. First user to log in becomes superadmin.
- **Per-user data isolation**: Each chatter sees only their own week records.
- **Week records**: Create/edit/delete weekly entries with daily net sales per shift. Auto-calculates base pay + commission.
- **Salary formula**: Base pay = hourlyRate × hoursPerDay. Commission calculated via configurable tiers on net sales.
- **Dual currency**: All amounts shown in PHP (₱) as primary, USD ($) as secondary.
- **Per-user settings**: Each user can customize hourly rate, hours/day, commission tiers, PHP/USD exchange rate via the gear icon in the home header.
- **Admin dashboard**: Admin users can view all chatters' week data, promote/demote users.
- **Default settings**: $2/hr × 8hrs = $16/day base. Commission: 0-$499.99→3%, $500-$999.99→4%, $1000+→5%. PHP rate: ₱56/USD.

### DB Tables
- `users` — Replit user profiles + `is_admin` flag (text "true"/"false")
- `week_records` — weekly entries with `user_id` FK, date range, daily entries (JSONB), timestamps
- `settings` — per-user settings with `user_id` PK (FK to users), hourly rate, hours/day, commission tiers (JSONB), PHP/USD rate

### Key Files
- `artifacts/salary-tracker/src/` — React + Vite frontend (shadcn/ui, React Query, wouter)
  - `pages/home.tsx` — dashboard with week list, settings gear, admin link
  - `pages/tracker.tsx` — week entry form (new/edit)
  - `pages/admin.tsx` — admin dashboard
  - `lib/salary.ts` — all salary calculation logic (accepts SalarySettings param)
  - `contexts/settings.tsx` — SettingsProvider that fetches/caches per-user settings
  - `components/settings-dialog.tsx` — pay settings dialog (hourly rate, hours/day, commission tiers, PHP rate)
- `artifacts/api-server/src/routes/` — Express route handlers
  - `auth.ts` — /api/auth/me, /login, /logout (Replit OIDC)
  - `weeks.ts` — CRUD for week records (user-scoped)
  - `settings.ts` — GET/PUT /api/settings (per-user, upsert)
  - `admin.ts` — admin-only routes for listing all users/weeks, promoting/demoting
- `lib/db/src/schema/` — Drizzle table definitions (auth.ts, weeks.ts, settings.ts)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── salary-tracker/     # React + Vite frontend (OF Chatter Salary Tracker)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
