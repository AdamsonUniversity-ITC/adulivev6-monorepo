# E-Leave Frontend (`apps/eleave`)

React application for AdULive E-Leave (apply, endorse, HR approve, admin, reports).

## Documentation

Product and developer docs:

**[../../docs/eleave/README.md](../../docs/eleave/README.md)**

## Stack

- React + TypeScript + Vite
- TanStack Router / Query / Table
- Tailwind + shared `@repo/ui`
- Axios cookie session via `@repo/axios-config` (`authSvc`, `hrmdoSvc`)

## Scripts

From this package directory:

```bash
pnpm dev      # Vite dev server
pnpm build    # Typecheck + production build
pnpm lint     # ESLint
pnpm test     # Vitest
```

From the monorepo root, use the workspace filter if configured (for example `pnpm --filter eleave dev`).

## Backend

API: sibling **hrmdo_service** module `app-modules/eleave`. See that module’s README and `docs/eleave/` for architecture and business rules.

## Auth

Root route `beforeLoad` requires an authenticated AdULive user. Restricted pages use permissions and HR profile flags (`src/lib/eleave-access.ts`, `eleave-route-access.ts`).
