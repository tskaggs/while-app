---
title: Onboarding
description: Step-by-step operator onboarding with sandbox credentials and API examples.
---

# Operator Onboarding

After signing up at `/signup`, the onboarding wizard provisions your organization:

1. **Team organization** — operator accounts and invitations
2. **Machine organization** — control plane identity for API keys and webhooks
3. **Sandbox API key** — `wh_test_*` (plaintext shown once; only a hash is stored)
4. **While Sandbox connection** — default system connection in the dashboard

## Step 1 — Organization

Confirms your organization name and provisions your sandbox environment.

## Step 2 — Sandbox credentials (one-time)

| Credential | Example | Notes |
|------------|---------|-------|
| API key | `wh_test_…` | Shown once; only the SHA-256 hash is stored |
| Webhook secret | `whsec_…` | Shown once; verify inbound `X-While-Signature` — see [Webhooks](/docs/webhooks) |
| Connection ID | `conn-sa-{org_short_id}` | In webhook payloads; webhook URL is set in **Settings**, not on connection Overview |

## Step 3 — Try the API

Fetches a synthetic FHIR Patient:

```bash
GET /v1/patients/pat_{org_short_id}_01
Authorization: Bearer wh_test_…
```

Discover org-scoped metadata (see [Sandbox](/docs/sandbox) for full endpoint reference):

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

The dashboard verifies HMAC signatures on test deliveries and displays received events in the onboarding flow. Configure or update your destination URL anytime under **Settings → Webhook URL** — see [Webhooks](/docs/webhooks).

## Step 5 — Team invites (optional)

Invite colleagues as Owner, Developer (member), or Manager (admin). Pending invites appear in **Settings → Team**.

## After onboarding

After you finish, you are redirected to the Overview dashboard with the **While Sandbox** connection visible in Sandbox mode.
