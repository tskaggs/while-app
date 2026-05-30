---
title: Sandbox
description: Synthetic FHIR sandbox, testable control plane endpoints, and what you need before calling them.
---

# Sandbox

The **While Sandbox** is a self-serve integration environment on the **While control plane**. It serves **synthetic FHIR R4 data** scoped to your organization — no real clinic connectivity and no PHI in the control plane.

Every account gets a system **While Sandbox** connection (`conn-sa-{org_short_id}`) and a sandbox API key (`wh_test_*`) during [onboarding](/docs/onboarding). Use the sandbox to validate Bearer auth, patient reads, webhook delivery, and dashboard telemetry before requesting live Sidecar connections.

See also [Environments](/docs/environments) for sandbox vs live semantics.

## Before you test

| Requirement | Needed for | How to get it |
|-------------|------------|---------------|
| **Sandbox API key** | All authenticated `/v1/*` calls | Onboarding Step 2 (`wh_test_*`) |
| **Organization provisioned** | Org-scoped patient IDs | Complete onboarding Step 1 |
| **Webhook URL configured** | `POST /v1/webhooks/trigger-mock-event` | **Settings → Webhook URL** (not shown on connection Overview) |
| **Webhook secret** | Verify inbound deliveries | Onboarding Step 2 (`whsec_*`, shown once) — see [Webhooks](/docs/webhooks) |

The onboarding wizard (**Steps 3–4**) can run API and webhook tests for you using your session — no manual `curl` required. Use the examples below when integrating from your own application.

## Base URL

All control plane requests use:

```
https://api.while.health
```

Path-only references in other docs (for example `GET /v1/patients`) are relative to this base URL.

## Authentication

All `/v1/*` endpoints require a **Bearer token** whose prefix matches your environment:

| Prefix | Environment |
|--------|-------------|
| `wh_test_*` | Sandbox |
| `wh_live_*` | Live (when provisioned) |

```bash
export WHILE_API_KEY="wh_test_your_key"
```

Operator sign-in and API key management are handled in the **While dashboard**. Machine-plane routes under `/v1/auth/*` and `/v1/keys/*` are not used for customer integrations.

## Testable endpoints

### Health (no auth)

Confirms the control plane is reachable:

```bash
curl -s https://api.while.health/health | jq .
```

Expected response includes `"status": "ok"`.

### Sandbox catalog

**`GET /v1/sandbox/catalog`** — metadata for your org: connection ID, sample patient IDs, supported webhook events, and example FHIR/webhook payloads.

| | |
|--|--|
| **Auth** | Sandbox key only (`wh_test_*`) |
| **Requires** | Valid sandbox API key |

```bash
curl -s -H "Authorization: Bearer $WHILE_API_KEY" \
  https://api.while.health/v1/sandbox/catalog | jq .
```

Use this to discover your org-scoped patient IDs (`pat_{org_short_id}_01` … `_05`) before calling `/v1/patients/{id}`.

### Patients

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/patients` | List five synthetic patient IDs for your org |
| `GET` | `/v1/patients/{patient_id}` | Fetch a synthetic FHIR R4 `Patient` resource |

| | |
|--|--|
| **Auth** | Valid API key for the target environment |
| **Patient ID format** | `pat_{org_short_id}_{01-05}` (404 for invalid format) |

```bash
# List IDs
curl -s -H "Authorization: Bearer $WHILE_API_KEY" \
  https://api.while.health/v1/patients | jq .

# Fetch one patient (use your org-scoped ID from /sandbox/catalog)
curl -s -H "Authorization: Bearer $WHILE_API_KEY" \
  https://api.while.health/v1/patients/pat_00000000_01 | jq .
```

Successful reads can emit an `api.request` webhook when delivery is configured, and appear in dashboard **Messages** / **Logs**.

### Trigger mock webhook

**`POST /v1/webhooks/trigger-mock-event`** — queues a synthetic clinical or tunnel event for delivery to your configured webhook URL.

| | |
|--|--|
| **Auth** | Valid API key |
| **Requires** | Webhook URL and webhook secret configured in Settings |
| **Response** | **202 Accepted** with `envelope_preview` |

```bash
curl -s -X POST \
  -H "Authorization: Bearer $WHILE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"patient.admitted","patient_id":"pat_00000000_01"}' \
  https://api.while.health/v1/webhooks/trigger-mock-event | jq .
```

**Clinical events** (require `patient_id`):

- `patient.created`, `patient.updated`, `patient.admitted`, `patient.discharged`
- `encounter.created`, `observation.created`

**Tunnel events** (simulated Sidecar connectivity; no `patient_id` required):

- `tunnel.connected`, `tunnel.disconnected`, `tunnel.handshake`, `tunnel.health`, `tunnel.latency`, `tunnel.reconnect`

If webhook URL or secret is missing, the API returns **422** — see [Error Codes](/docs/error-codes).

## End-to-end webhook test

1. Complete onboarding through **Step 2** and save your webhook secret.
2. Set **Settings → Webhook URL** to an HTTPS endpoint you control (or use the onboarding test flow).
3. Trigger an event:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $WHILE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"patient.admitted","patient_id":"pat_00000000_01"}' \
  https://api.while.health/v1/webhooks/trigger-mock-event | jq .
```

4. Confirm delivery at your webhook URL and in dashboard **Messages**.
5. Verify `X-While-Signature` using your `whsec_*` secret — see [Webhooks](/docs/webhooks).

You can also run the same flow from onboarding **Step 4** (“Send test webhook”) in the dashboard.

## Related docs

- [Getting Started](/docs/getting-started) — first API call and environment overview
- [Onboarding](/docs/onboarding) — credential provisioning and wizard steps
- [Webhooks](/docs/webhooks) — payload shape, signatures, and event types
- [Error Codes](/docs/error-codes) — HTTP statuses and troubleshooting
