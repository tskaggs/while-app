# While

Healthcare EMR/EHR connectivity platform built with **Nuxt 4**. Operators monitor integrations, tunnels, and compliance from a single console with separate **Sandbox** and **Live** environments.

## Features

- **Authentication** — Better Auth 1.6.12 (email/password, organizations, team invites)
- **Onboarding** — sandbox provisioning, API key display, live API/webhook tests, code snippets
- **Overview** — usage KPIs, throughput chart, connection watchlist
- **Sandbox / Live** — global environment switcher; system sandbox connection (no live twin)
- **Connections** — partner directory + While Sandbox system connection
- **Support** — inbox plus multi-step connection request flows
- **Developer Docs** — integrator documentation via Nuxt Content (`/docs`)
- **Settings** — appearance, org info, API keys (masked), webhook URL, team management

Set `NUXT_PUBLIC_MOCK_MODE=true` to run the UI with static mock data only (no database).

## Stack

- Nuxt 4.4 · Nuxt UI 4 · Tailwind CSS 4
- Better Auth 1.6.12 · Prisma 6 · PostgreSQL (shared with ultra-a)
- Nuxt Content 3 · Unovis · Iconoir · TypeScript · VueUse

## Prerequisites

- [pnpm](https://pnpm.io)
- PostgreSQL (shared with [ultra-a](https://github.com/your-org/ultra-a) control plane)
- ultra-a FastAPI backend running at `http://localhost:8000`

## Getting started

```bash
cp .env.example .env
pnpm install
pnpm dev
```

### Environment variables

```env
DATABASE_URL=postgresql://while:while@localhost:5433/while
WHILE_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<random-32+-chars>
BETTER_AUTH_URL=http://localhost:3000
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_MOCK_MODE=false
```

Host Postgres is exposed on **port 5433** (see `ultra-a/docker-compose.yml`) so it does not conflict with a local PostgreSQL install on 5432.

### Database migrations

Auth and dashboard tables are managed by Prisma:

```bash
pnpm db:generate   # Better Auth schema + prisma generate
pnpm db:migrate    # prisma migrate dev
```

Machine-plane tables (`organizations`, `api_keys`, `sandbox_settings`) are owned by ultra-a — see `ultra-a/scripts/init.sql`.

### ultra-a backend

```bash
cd ../ultra-a
docker compose up --build
```

Smoke test:

```bash
curl -s -H "Authorization: Bearer wh_test_devseed0000000000000001" \
  http://localhost:8000/v1/patients/pat_01JM | jq .
```

## Scripts

```bash
pnpm dev          # development server
pnpm build        # production build
pnpm typecheck    # vue-tsc
pnpm lint         # eslint
pnpm db:migrate   # Prisma migrations
```

## Project layout

```
app/
  components/     # UI by domain
  composables/    # useConnections, useEnvironment, …
  lib/            # auth-client.ts
  middleware/     # auth.global.ts, onboarding.global.ts
  pages/          # routes incl. login, signup, onboarding
content/docs/     # Developer Docs
prisma/           # schema + migrations
server/
  api/            # auth, onboarding, webhooks, org, settings
  lib/            # auth.ts, prisma.ts
  utils/          # provisionOrg.ts
```

## Documentation

- [`doc/interface.md`](./doc/interface.md) — UX/product write-up
- [`content/docs/`](./content/docs/) — integrator docs at `/docs`
