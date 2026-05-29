---
title: Onboarding
description: Step-by-step operator onboarding with sandbox credentials and API examples.
---

# Operator Onboarding

After signing up at `/signup`, the onboarding wizard provisions your organization in four layers:

1. **Better Auth organization** — user/team auth (AuthN)
2. **Machine organization** — shared Postgres row in `organizations`
3. **Sandbox API key** — `wh_test_*` hashed in `api_keys`
4. **While Sandbox connection** — default system connection in `dashboard_connections`

## Step 1 — Organization

Confirms your organization name and runs server-side provisioning via `POST /api/onboarding/provision`.

## Step 2 — Sandbox credentials (one-time)

| Credential | Example | Notes |
|------------|---------|-------|
| API key | `wh_test_…` | Shown once; only the SHA-256 hash is stored |
| Webhook secret | `whsec_…` | Used to verify `X-While-Signature` |
| Connection ID | `conn-sa-{org_short_id}` | Appears in webhook envelopes |

## Step 3 — Try the API

Fetches a synthetic FHIR Patient:

```bash
GET /v1/patients/pat_{org_short_id}_01
Authorization: Bearer wh_test_…
```

Discover org-scoped metadata:

```bash
GET /v1/sandbox/catalog
```

## Step 4 — Code snippets & webhook test

Trigger a mock clinical event:

```bash
POST /v1/webhooks/trigger-mock-event
Content-Type: application/json

{"event":"patient.admitted","patient_id":"pat_{org_short_id}_01"}
```

Expected 202 response:

```json
{
  "status": "queued",
  "event": "patient.admitted",
  "patient_id": "pat_00000000_01",
  "connection_id": "conn-sa-00000000",
  "envelope_preview": { "event": "patient.admitted", "…": "…" }
}
```

The dashboard webhook receiver at `/api/webhooks/while` verifies HMAC signatures and displays received events.

## Step 5 — Team invites (optional)

Invite colleagues as Owner, Developer (member), or Manager (admin). In development, invite links are logged to the server console and shown in Settings.

## After onboarding

Completed onboarding sets `org_onboarding.completed_at` and redirects to the Overview dashboard with the **While Sandbox** connection visible in Sandbox mode.
