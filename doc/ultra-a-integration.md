# while-app ↔ ultra-a integration

This document describes how the **While operator dashboard** (`while-app`, Nuxt 4) integrates with the **While Health control plane** (`ultra-a`, FastAPI) in the current version: Better Auth sign-in, shared PostgreSQL, sandbox onboarding, and server-proxied API tests.

For product/UX detail see [interface.md](./interface.md). For integrator-facing API docs see [`content/docs/`](../content/docs/) (served at `/docs`).

---

## Repositories and responsibilities

| Repo | Runtime | Role |
|------|---------|------|
| **while-app** | Nuxt 4 @ `:3000` | Operator UI, AuthN (Better Auth), org onboarding, dashboard state, webhook **receiver** |
| **ultra-a** | FastAPI @ `:8000` | AuthZ (Bearer API keys), synthetic FHIR sandbox, webhook **delivery**, cron mock events |

**AuthN** (who is logged into the dashboard) lives entirely in while-app.

**AuthZ** (which machine org an API key belongs to) lives entirely in ultra-a, reading hashed keys from Postgres.

Neither service persists PHI. Sandbox patients and webhook payloads are generated in memory.

---

## Local development topology

```text
┌─────────────────────────────────────────────────────────────────┐
│  Browser  http://localhost:3000                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  while-app (Nuxt Nitro)                                         │
│  • Better Auth  /api/auth/*                                     │
│  • Onboarding   /api/onboarding/*                               │
│  • Webhook RX   POST /api/webhooks/while                        │
│  • Prisma → PostgreSQL                                          │
└────────────┬───────────────────────────────┬────────────────────┘
             │ DATABASE_URL                  │ WHILE_API_URL
             │ localhost:5433                │ localhost:8000
             ▼                               ▼
┌────────────────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL (Docker)       │   │  ultra-a (FastAPI)           │
│  ultra-a docker compose    │◄──│  reads api_keys, orgs,       │
│  host port 5433 → 5432     │   │  sandbox_settings            │
└────────────────────────────┘   └──────────────────────────────┘
```

Start order:

1. `cd ../ultra-a && docker compose up --build` — Postgres + API
2. `cd while-app && cp .env.example .env && pnpm install && pnpm db:migrate && pnpm dev`

Postgres is mapped to **5433** on the host so it does not clash with a local Postgres on 5432.

---

## Shared database

Both services connect to the **same** database (`while`). Table ownership is split:

### while-app (Prisma migrations)

| Table | Purpose |
|-------|---------|
| `user`, `session`, `account`, `verification` | Better Auth |
| `organization`, `member`, `invitation` | Better Auth orgs / teams |
| `dashboard_connections` | Connection rows shown in the UI |
| `org_onboarding` | Onboarding completion timestamps |

### ultra-a (`scripts/init.sql` + Alembic)

| Table | Purpose |
|-------|---------|
| `organizations` | Machine-plane customer org (UUID) |
| `api_keys` | SHA-256 hashed Bearer tokens |
| `sandbox_settings` | Webhook URL, secret, cron flags |

Prisma maps `organizations` → `MachineOrganization` to avoid clashing with Better Auth’s `organization` table.

Canonical DDL comments: [`ultra-a/scripts/init.sql`](../../ultra-a/scripts/init.sql)

---

## Two organization IDs

Every dashboard customer has **two** org records:

| Layer | Table | ID type | Example |
|-------|-------|---------|---------|
| Auth org | `organization` | Better Auth string | `7Rqlct15RRlObuZeKuXibxTfjqHWbin5` |
| Machine org | `organizations` | UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |

Better Auth org IDs are not UUIDs. Machine-plane foreign keys require UUIDs. while-app links them via JSON metadata on the auth org:

```json
{ "machineOrgId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

`resolveMachineOrgId()` (`server/utils/resolveMachineOrg.ts`) runs on every authenticated server route that touches machine-plane data:

1. If auth org metadata already has `machineOrgId`, use it.
2. Otherwise generate a UUID, persist it in metadata, and use that for provisioning.

All Prisma queries against `organizations`, `api_keys`, `sandbox_settings`, and `dashboard_connections` use the **machine org UUID**, never the Better Auth org id.

---

## Onboarding and provisioning

Operator flow: `/signup` → `/onboarding` (five steps).

Provisioning is triggered by `POST /api/onboarding/provision` and implemented in `server/utils/provisionOrg.ts`. In one transaction it creates:

| Artifact | Storage | Notes |
|----------|---------|-------|
| Machine org | `organizations` | `metadata: { has_live: false, plan: "startup" }` |
| Sandbox API key | `api_keys` | Plaintext shown in UI; only SHA-256 hash stored |
| Webhook config | `sandbox_settings` | URL points at while-app receiver; `whsec_*` secret |
| While Sandbox connection | `dashboard_connections` | ID `conn-sa-{org_short_id}`, not deletable |
| Onboarding row | `org_onboarding` | `completed_at` set when wizard finishes |

**Org-scoped naming** (derived from machine org UUID):

- `org_short_id` — first 8 hex chars of UUID without dashes
- Connection ID — `conn-sa-{org_short_id}`
- Sample patient ID — `pat_{org_short_id}_01` (matches ultra-a sandbox engine)

**Webhook URL** written at provision time:

```text
{BETTER_AUTH_URL}/api/webhooks/while
```

ultra-a’s delivery worker POSTs signed payloads to this URL. The Nuxt handler verifies `X-While-Signature` with HMAC-SHA256 over the raw body.

### API key lifecycle

| Phase | Behavior |
|-------|----------|
| First provision | Generate `wh_test_{secret}`; store hash; keep plaintext in server memory (`pendingApiKeys`) |
| During onboarding | Key can be copied repeatedly; also sent from client on test endpoints if server memory was cleared |
| Incomplete onboarding, key lost | `resolveOnboardingSandboxKey()` rotates a new sandbox key (deactivates old hash) |
| Onboarding complete | Pending plaintext cleared; only masked prefix shown in Settings |

### API key hashing contract

Both repos must use the same algorithm (documented in [`ultra-a/README.md`](../../ultra-a/README.md)):

```typescript
// while-app — server/utils/provisionOrg.ts
secret = rawKey.slice('wh_test_'.length) // or wh_live_
hashedKey = sha256(secret).hex()
```

ultra-a strips the prefix and hashes the secret identically in `app/core/security.py`.

---

## Request flows

### 1. Sign-in and session

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as while-app
  participant DB as PostgreSQL

  B->>N: POST /api/auth/sign-in/email
  N->>DB: session + user
  N-->>B: Set-Cookie (session)
  Note over N,DB: activeOrganizationId may be empty after login
  N->>DB: ensureActiveOrganization (first member org)
```

Login and server middleware auto-select the user’s first org membership when `activeOrganizationId` is missing.

### 2. Onboarding API test (step 3)

The browser never calls ultra-a directly for onboarding tests. Nuxt proxies with the sandbox key:

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as while-app
  participant U as ultra-a
  participant DB as PostgreSQL

  B->>N: GET /api/onboarding/test-patient<br/>Header: X-Sandbox-Api-Key
  N->>DB: resolveSandboxApiKey (hash match)
  N->>U: GET /v1/patients/pat_{org_short_id}_01<br/>Authorization: Bearer wh_test_…
  U->>DB: verify hashed_key + environment
  U-->>N: Synthetic FHIR Patient JSON
  N-->>B: patient + catalog
```

Related endpoints:

- `GET /api/onboarding/test-patient` → `GET /v1/patients/{id}` + `GET /v1/sandbox/catalog`
- `POST /api/onboarding/test-webhook` → `POST /v1/webhooks/trigger-mock-event`

### 3. Webhook delivery

```mermaid
sequenceDiagram
  participant U as ultra-a
  participant N as while-app POST /api/webhooks/while
  participant DB as PostgreSQL

  U->>N: POST envelope JSON<br/>X-While-Signature, X-While-Event
  N->>DB: sandbox_settings by payload.org_id (UUID)
  N->>N: HMAC-SHA256 verify
  N-->>U: 200 { received: true }
```

Envelope shape (from ultra-a):

```json
{
  "event": "patient.admitted",
  "resource": { "resourceType": "Encounter", "id": "..." },
  "connection_id": "conn-sa-00000000",
  "environment": "sandbox",
  "timestamp": "2026-05-29T12:00:00Z",
  "org_id": "00000000-0000-4000-8000-000000000001"
}
```

`org_id` in the payload is the **machine org UUID**, matching `organizations.id`.

---

## ultra-a API surface used by while-app

| Method | Path | Used when |
|--------|------|-----------|
| `GET` | `/v1/patients/{patient_id}` | Onboarding step 3, integrator examples |
| `GET` | `/v1/sandbox/catalog` | Onboarding metadata, sample IDs |
| `POST` | `/v1/webhooks/trigger-mock-event` | Onboarding step 4 webhook test |
| `GET` | `/health` | Ops / smoke tests |

Not used by while-app (501 or future):

- `GET /v1/auth/status` — AuthN owned by Nuxt
- `GET /v1/keys/` — key CRUD owned by Nuxt

Environment enforcement on ultra-a:

- `wh_test_*` → sandbox routes and data
- `wh_live_*` → live (403 if org has no live keys / `metadata.has_live` is false)

---

## Seed data vs customer orgs

ultra-a seeds a **dev org** on every API start (`scripts/seed.py`):

| Field | Value |
|-------|-------|
| Org ID | `00000000-0000-4000-8000-000000000001` |
| Name | Acme Health Inc. |
| Sandbox key | `wh_test_devseed0000000000000001` |

This org is independent of Better Auth signups. New customers provision their **own** machine org UUID and API key through the onboarding wizard.

You can smoke-test ultra-a without the dashboard using the seed key above. Dashboard customers use keys provisioned by while-app.

---

## Environment variables (cross-repo)

| Variable | Set in | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | while-app | `postgresql://while:while@localhost:5433/while` |
| `WHILE_API_URL` | while-app (server) | `http://localhost:8000` — ultra-a base URL |
| `NUXT_PUBLIC_WHILE_API_URL` | while-app (optional) | Public override for client-side docs/snippets |
| `BETTER_AUTH_URL` | while-app | Public URL for auth + webhook base (`/api/webhooks/while`) |
| `BETTER_AUTH_SECRET` | while-app | Session signing |
| `NUXT_PUBLIC_MOCK_MODE` | while-app | `true` bypasses DB/auth (UI-only) |
| `DATABASE_URL` | ultra-a | Docker internal `postgres:5432` |
| `CORS_ORIGINS` | ultra-a | `http://localhost:3000` for dev |

---

## while-app server routes (integration touchpoints)

| Route | ultra-a / DB interaction |
|-------|--------------------------|
| `POST /api/onboarding/provision` | Writes machine-plane rows; sets webhook URL |
| `GET /api/onboarding/credentials` | Reads provision state; may rotate sandbox key |
| `GET /api/onboarding/test-patient` | Calls ultra-a patients + catalog |
| `POST /api/onboarding/test-webhook` | Calls ultra-a trigger-mock-event |
| `POST /api/onboarding/complete` | Marks onboarding done; clears pending key |
| `POST /api/webhooks/while` | Receives ultra-a deliveries; ingests telemetry |
| `GET /api/org/status` | Reads org, keys, connections from DB |
| `GET /api/connections` | Lists `dashboard_connections` for machine org |
| `GET /api/telemetry/messages` | Dashboard messages (persisted) |
| `GET /api/telemetry/logs` | Dashboard logs |
| `GET /api/telemetry/tunnel` | Tunnel uptime data |
| `GET /api/telemetry/metrics` | Overview KPIs + chart |

Auth catch-all: `/api/auth/[...all]` → Better Auth handler (`server/lib/auth.ts`).

---

## Telemetry tables (while-app Prisma)

| Table | Purpose |
|-------|---------|
| `processed_messages` | Messages view + throughput |
| `integration_logs` | Logs view (integration, tunnel, webhook, api) |
| `tunnel_logs` | Tunnel uptime view |
| `tunnel_incidents` | Simulated disconnect incidents |
| `daily_metric_rollups` | Overview chart aggregates |

Populated by `ingestWebhookEnvelope()` when ultra-a delivers webhooks. No historical backfill on provision — data accumulates via cron and API activity.

---

## Mock mode

`NUXT_PUBLIC_MOCK_MODE=true` runs while-app without Postgres or ultra-a. Static mock data fills the dashboard; auth and onboarding gates are skipped. Use this for UI work only — it does not exercise the integration described above.

---

## Version notes (2026-05)

This integration version adds:

- Better Auth 1.6.12 with organization plugin (signup, login, invites)
- Prisma 6 schema spanning auth, machine-plane, and dashboard tables
- Five-step onboarding wizard with credential export and live API/webhook tests
- Dual org ID mapping (`machineOrgId` metadata)
- Server-proxied onboarding API calls and HMAC webhook receiver
- Sandbox key rotation for incomplete onboarding recovery
- Shared Postgres on port **5433** via ultra-a Docker Compose
- Persisted dashboard telemetry (messages, logs, tunnel uptime, metrics) from webhook ingest
- ultra-a tunnel/sidecar simulation + `api.request` webhooks

Future work (not in this version): live key provisioning UI, production deploy wiring, webhook retry UI, real Firecracker Data Plane.
