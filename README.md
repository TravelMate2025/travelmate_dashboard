# TravelMate Dashboard

Admin dashboard for TravelMate operations, built with Next.js App Router and TypeScript.

## Prerequisites

- Node.js 18+
- npm 9+

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Setup

1. Install dependencies:

```bash
npm install
```

1. Create local environment file from the template:

```bash
cp .env.example .env.local
```

1. Set environment variables in `.env.local`:

```bash
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-host>/api/
```

Notes:

- `NEXT_PUBLIC_API_BASE_URL` overrides internal defaults.
- Keep secrets out of committed files.

## Current Project Architecture

The current codebase is organized primarily under `src/` as follows:

```text
src/
  app/                # Next.js App Router pages, layouts, route groups
    Dashboard/        # Dashboard feature routes
    api/              # Route handlers (if present)
    auth/             # Authentication pages/flows
    invitations/      # Invitation acceptance flow
    providers/        # App-level provider composition

  components/         # UI and view components
    molecues/         # Feature-level composed components (legacy naming kept)
    pages/            # Page-scoped component groups
    reuseables/       # Shared reusable components
    ui/               # Base UI primitives (Radix/custom)

  config/             # API/auth/env/link configuration
  context/            # React contexts
  hooks/              # Data and UI hooks
  lib/                # Utilities and schemas
  services/           # API service clients by domain
  shared/             # Shared config/lib/types exports
  types/              # Global and framework type declarations
  utils/              # App utilities
  widgets/            # Widget-level composition
```

## Import Aliases

Configured aliases (see `tsconfig.json`):

- `@/*` -> `src/*`
- `@app/*` -> `src/app/*`
- `@shared/*` -> `src/shared/*`
- `@widgets/*` -> `src/widgets/*`

## Notes For Contributors

- Prefer editing/adding domain API logic in `src/services/*` and consume via hooks in `src/hooks/api/*`.
- Keep route files in `src/app/*` focused on composition and page-level orchestration.
- Use trailing slashes for backend endpoints where required by the API.
