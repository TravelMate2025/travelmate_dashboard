# TravelMate Dashboard

Enterprise-grade Next.js admin dashboard for TravelMate operations.

## Enterprise Architecture (Incremental)

The codebase is migrating from layer-first folders to a feature-first/layered architecture:

- `src/app` — routes, layouts, providers (composition only)
- `src/features` — product features (UI + feature logic)
- `src/entities` — reusable domain models and contracts
- `src/widgets` — composed sections across features/entities
- `src/shared` — stable cross-cutting utilities/config/types/ui primitives

### Current foundation added

- App provider composition: `src/app/providers`
- Feature slice started: `src/features/support/faq/delete-faq`
- Shared public API: `src/shared`
- Layer aliases: `@app/*`, `@features/*`, `@shared/*`, `@entities/*`, `@widgets/*`

### Rules and boundaries

- Shared layer cannot depend on app/features/widgets (enforced in ESLint for `src/shared/**`).
- New architecture layers (`app/providers`, `features`, `shared`, `entities`, `widgets`) use stricter lint rules.
- Legacy modules remain compatible during migration.

## Run

```bash
npm install
npm run dev
```

## API Base URL

- Live: `https://travelmate-backend-1-1lgj.onrender.com/api/`
- Staging: `https://travelmate-backend-knvd.onrender.com/api/`

Configuration behavior:

- `NEXT_PUBLIC_API_BASE_URL` (optional) overrides default base URL.
- If omitted, app defaults by environment:
  - `NEXT_PUBLIC_ENVIRONMENT=production` → Live
  - otherwise → Staging

Example `.env.local`:

```bash
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_BASE_URL=https://travelmate-backend-knvd.onrender.com/api/
```

Tip: copy from `.env.example` to avoid config drift across environments.

## Quality

```bash
npm run lint
```

## Migration strategy

1. Pick one flow and move to `src/features/<domain>/<feature>`.
2. Keep page route thin: compose from feature exports.
3. Move local types/components into feature folder.
4. Replace deep relative imports with aliases.
5. Repeat by domain (Support → Bookings → Notifications → Users → CMS).
