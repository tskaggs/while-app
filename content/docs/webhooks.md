---
title: Webhooks
description: Receive real-time FHIR events from While Sidecar instances.
---

# Webhooks

While delivers normalized FHIR R4 events to your configured webhook URL when data flows through a Sidecar.

## Configuration

Set your webhook URL in **Settings → Webhook URL**. Each environment (Sandbox/Live) can have a separate destination.

## Event Payload

```json
{
  "event": "patient.created",
  "resource": {
    "resourceType": "Patient",
    "id": "example"
  },
  "connection_id": "conn-lv-001",
  "environment": "live",
  "timestamp": "2026-05-20T14:55:00Z"
}
```

## Signature Verification

All webhook payloads include an `X-While-Signature` header with an HMAC-SHA256 signature. Verify using your webhook secret:

```typescript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex')
```

## Event Types

| Event | Description |
|-------|-------------|
| `patient.created` | New patient record normalized from HL7 ADT |
| `patient.updated` | Patient demographics changed |
| `observation.created` | Lab result or vital sign received |
| `encounter.created` | New encounter or visit |
| `tunnel.connected` | WireGuard tunnel established |
| `tunnel.disconnected` | Tunnel lost — check connection health |

## Retry Policy

Failed webhook deliveries (non-2xx response) are retried with exponential backoff: 1m, 5m, 15m, 1h, up to 24h.
