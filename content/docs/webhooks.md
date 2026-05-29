---
title: Webhooks
description: Receive real-time FHIR events from the While control plane and Sidecars.
---

# Webhooks

While delivers normalized FHIR R4 events to your configured webhook URL.

## Configuration

Set your webhook URL in **Settings → Webhook URL**. During onboarding, the dashboard configures a test receiver at `/api/webhooks/while` on your Nuxt server.

Sandbox webhook secrets use the `whsec_*` prefix and are provisioned during onboarding.

## Event Payload

```json
{
  "event": "patient.admitted",
  "resource": {
    "resourceType": "Encounter",
    "id": "enc_00000000_12345"
  },
  "connection_id": "conn-sa-00000000",
  "environment": "sandbox",
  "timestamp": "2026-05-29T12:00:00Z",
  "org_id": "00000000-0000-4000-8000-000000000001"
}
```

## Signature Verification

Outbound payloads include `X-While-Signature` (HMAC-SHA256) and `X-While-Event` headers:

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

const expected = createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex')

if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
  throw new Error('Invalid signature')
}
```

## Trigger a test webhook (sandbox)

```bash
curl -s -X POST \
  -H "Authorization: Bearer wh_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{"event":"patient.admitted","patient_id":"pat_00000000_01"}' \
  http://localhost:8000/v1/webhooks/trigger-mock-event | jq .
```

The 202 response includes `connection_id` and `envelope_preview` showing what will be delivered.

## Event Types (Phase 1)

| Event | Description |
|-------|-------------|
| `patient.created` | Synthetic patient record |
| `patient.updated` | Patient demographics changed |
| `patient.admitted` | Inpatient admission |
| `patient.discharged` | Discharge event |
| `encounter.created` | New encounter |
| `observation.created` | Lab result or vital sign |

**Not yet implemented:** webhook retry/replay queues, `tunnel.connected` / `tunnel.disconnected` events.
