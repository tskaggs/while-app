# While

Healthcare EMR/EHR connectivity platform built with **Nuxt 4**. Operators monitor integrations, tunnels, and compliance from a single console with separate **Sandbox** and **Live** environments.

## Features

- **Authentication** — Better Auth 1.6.12 (email/password, organizations, team invites)
- **Onboarding** — sandbox provisioning, credential export (copy/CSV), API + webhook tests, code snippets
- **Overview** — usage KPIs, throughput chart, connection watchlist
- **Sandbox / Live** — global environment switcher; system sandbox connection (no live twin)
- **Connections** — partner directory + While Sandbox system connection
- **Support** — inbox plus multi-step connection request flows
- **Developer Docs** — integrator documentation via Nuxt Content (`/docs`)
- **Settings** — appearance, org info, API keys (masked), webhook URL, team management

Set `NUXT_PUBLIC_MOCK_MODE=true` to run the UI with static mock data only (no database or auth).

## Stack

- Nuxt 4.4 · Nuxt UI 4 · Tailwind CSS 4
- Better Auth 1.6.12 · Prisma 6 · PostgreSQL (shared with ultra-a)
- Nuxt Content 3 · Unovis · Iconoir · TypeScript · VueUse

## Prerequisites

- [pnpm](https://pnpm.io) 11+
- [Docker](https://www.docker.com) (for ultra-a Postgres + API)
- [ultra-a](../ultra-a) control plane (FastAPI + shared Postgres)

## Getting started

### 1. Start the control plane

From the sibling `ultra-a` repo:

```bash
cd ../ultra-a
docker compose up --build
```

Postgres is exposed on host port **5433** (not 5432) to avoid conflicting with a local PostgreSQL install.

Smoke test the API:

```bash
curl -s -H "Authorization: Bearer wh_test_devseed0000000000000001" \
  http://localhost:8000/v1/patients/pat_01JM | jq .
```

### 2. Configure the dashboard

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup), create an account and organization, then complete the onboarding wizard at `/onboarding`.

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Shared Postgres (`postgresql://while:while@localhost:5433/while`) |
| `WHILE_API_URL` | ultra-a FastAPI base URL (`http://localhost:8000`) |
| `BETTER_AUTH_SECRET` | Session signing secret (32+ chars in production) |
| `BETTER_AUTH_URL` | Public auth handler URL (`http://localhost:3000`) |
| `NUXT_PUBLIC_SITE_URL` | Public site URL for links/OG |
| `NUXT_PUBLIC_MOCK_MODE` | `true` = UI-only dev without DB |

See [`.env.example`](./.env.example) for defaults.

### Database

Prisma manages Better Auth tables plus dashboard app tables (`dashboard_connections`, `org_onboarding`, etc.):

```bash
pnpm db:generate   # regenerate client after schema changes
pnpm db:migrate    # apply migrations (run after ultra-a Postgres is up)
pnpm db:migrate:dev  # author new migrations only (shared DB may show ultra-a drift)
pnpm db:push       # push schema without migration (dev only)
```

Machine-plane tables (`organizations`, `api_keys`, `sandbox_settings`) share the same database with ultra-a. The first Prisma migration includes their baseline so migrations apply on a fresh or Docker-init DB.

## Auth & organization model

Two org IDs coexist by design:

| Layer | Table | ID format | Purpose |
|-------|-------|-----------|---------|
| **Auth org** | `organization` | Better Auth string ID | Users, sessions, invites |
| **Machine org** | `organizations` | UUID | API keys, sandbox settings, connections |

Better Auth `organization.id` is linked to the machine-plane UUID via `organization.metadata.machineOrgId`. Server routes resolve the machine org before any control-plane DB access.

**Routes:** `/login`, `/signup`, `/onboarding`, `/accept-invitation/[id]` · Auth API at `/api/auth/*`

## Onboarding flow

1. **Organization** — provisions machine org, sandbox API key, webhook secret, While Sandbox connection
2. **Credentials** — copy individual fields or download CSV; key stays available until onboarding completes
3. **API test** — `GET /v1/patients/{id}` via ultra-a
4. **Snippets & webhook** — curl/TypeScript examples + mock event delivery to `/api/webhooks/while`
5. **Team invites** (optional) — invite colleagues; dev mode logs invite links to the server console

If you lose your sandbox API key before finishing onboarding, sign in again and continue at `/onboarding` — a new key is issued automatically while onboarding is incomplete.

## Scripts

```bash
pnpm dev          # development server (http://localhost:3000)
pnpm build        # production build
pnpm preview      # preview production build
pnpm typecheck    # vue-tsc
pnpm lint         # eslint
pnpm db:migrate   # Prisma migrations
pnpm db:generate  # Prisma client + auth schema helper
```

## Project layout

```
app/
  components/       # UI by domain
  composables/      # useConnections, useEnvironment, …
  lib/              # auth-client.ts
  middleware/       # auth.global.ts, onboarding.global.ts
  pages/            # routes incl. login, signup, onboarding
content/docs/       # integrator docs (served at /docs)
prisma/             # schema + migrations
server/
  api/
    auth/           # Better Auth catch-all
    onboarding/     # provision, credentials, test-patient, test-webhook, complete
    webhooks/       # while.post.ts (HMAC webhook receiver)
    org/            # status
    connections/    # dashboard connection list
    settings/       # webhook URL
    team/           # invite links (dev)
  lib/              # auth.ts, prisma.ts
  utils/            # provisionOrg, resolveMachineOrg, resolveSandboxApiKey, …
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `User was denied access on the database` | Wrong Postgres port | Use port **5433** in `DATABASE_URL`; start ultra-a Docker |
| `No active organization` / provision 400 after login | Session missing active org | Sign in again (auto-selects your org) or complete signup |
| Step 3 API test 400 | Sandbox key not in server memory | Return to step 2; key is reissued if onboarding is incomplete |
| Prisma UUID error on provision | Auth org ID passed to UUID column | Ensure latest code (`resolveMachineOrgId`) is running |
| Signup fails: `Argument id is missing` | Stale auth config | Do not set `advanced.database.generateId: 'uuid'` in auth |

## Documentation

- [`doc/interface.md`](./doc/interface.md) — UX/product write-up
- [`doc/ultra-a-integration.md`](./doc/ultra-a-integration.md) — control plane integration (shared DB, auth, onboarding, webhooks)
- [`content/docs/`](./content/docs/) — integrator docs at `/docs` (getting started, onboarding, webhooks, environments)

## Mock mode

For UI-only work without Postgres or Better Auth:

```env
NUXT_PUBLIC_MOCK_MODE=true
```

The top nav and dashboard render with static mock data. Auth middleware and onboarding gates are bypassed.
