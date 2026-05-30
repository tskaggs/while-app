---
title: Webhooks
description: Configure your webhook URL, verify signed deliveries with your webhook secret, and receive FHIR events from While.
---

# Webhooks

While delivers normalized FHIR R4 events to an **HTTPS endpoint you configure**. Each delivery is signed with your **webhook secret** so you can verify it came from While before processing.

## Where settings live

Webhook configuration is **organization-scoped**. It is **not** shown on the connection **Overview** page (which lists Connection ID, API base URL, and integration metrics for the While Sandbox connection).

| Credential / setting | Where to find it |
|----------------------|------------------|
| **Webhook URL** | **Settings → Webhook URL** |
| **Webhook secret** | Onboarding **Step 2 — Sandbox credentials** (shown **once**, `whsec_*`) |
| **Connection ID** | Onboarding Step 2, connection Overview, or the `connection_id` field in each webhook payload |
| **Sandbox API key** | Onboarding Step 2 (shown once, `wh_test_*`) — used to **trigger** test events, not to verify inbound webhooks |

Save the webhook secret when it is displayed during onboarding. Like the sandbox API key, the plaintext secret is not shown again in Settings.

## How to use webhooks

### 1. Set your webhook URL

In the dashboard, open **Settings → Webhook URL** and enter a public **HTTPS** endpoint your application controls, for example:

```
https://your-app.com/webhooks/while
```

While sends **HTTP POST** requests to this URL for sandbox events (clinical mocks, tunnel simulation, API activity) and for live Sidecar events once connections are active.

The URL applies to your **organization**, not to an individual connection row in the dashboard. The target connection is identified inside each payload by `connection_id` (for example `conn-sa-{org_short_id}` for the system sandbox).

### 2. Store your webhook secret

During onboarding **Step 2**, copy the **Webhook secret** (`whsec_…`) alongside your sandbox API key. You need this secret on your server to verify `X-While-Signature` on every inbound request.

Treat it like a password: store it in a secrets manager or environment variable (for example `WHILE_WEBHOOK_SECRET`), not in client-side code or source control.

### 3. Implement a signed webhook receiver

Your endpoint must:

1. Read the **raw request body** as bytes or a string **before** parsing JSON.
2. Compute HMAC-SHA256 of that raw body using your webhook secret.
3. Compare the result (hex-encoded) to the `X-While-Signature` header using a constant-time comparison.
4. Parse the JSON payload and process the event.
5. Respond with **2xx** promptly so While can record successful delivery.

**Request headers**

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-While-Signature` | Hex-encoded HMAC-SHA256 of the raw body, keyed with your webhook secret |
| `X-While-Event` | Event type (matches the `event` field in the body) |
| `User-Agent` | `While-ControlPlane/0.1` |

**Node.js example**

```typescript
import { createHmac, timingSafeEqual } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'

const webhookSecret = process.env.WHILE_WEBHOOK_SECRET!

export async function whileWebhookHandler(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const rawBody = Buffer.concat(chunks)

  const signature = req.headers['x-while-signature']
  if (typeof signature !== 'string') {
    res.writeHead(401)
    res.end('Missing signature')
    return
  }

  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'))

  if (!valid) {
    res.writeHead(401)
    res.end('Invalid signature')
    return
  }

  const payload = JSON.parse(rawBody.toString('utf8'))
  const eventType = req.headers['x-while-event'] ?? payload.event

  // Process payload.resource, payload.connection_id, payload.org_id, etc.
  console.log('While webhook', eventType, payload.connection_id)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ received: true }))
}
```

**Python example**

```python
import hmac
import hashlib
import json
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret"

@app.post("/webhooks/while")
def while_webhook():
    raw_body = request.get_data()
    signature = request.headers.get("X-While-Signature", "")

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        abort(401)

    payload = json.loads(raw_body)
    event_type = request.headers.get("X-While-Event", payload.get("event"))

    # Process payload["resource"], payload["connection_id"], etc.
    return {"received": True}, 200
```

Do **not** verify using the sandbox API key (`wh_test_*`). API keys authenticate **outbound** calls you make to While; the webhook secret authenticates **inbound** deliveries from While.

### 4. Trigger a test delivery (sandbox)

Use your sandbox API key to queue a mock event. While delivers it to the webhook URL from Settings:

```bash
curl -s -X POST \
  -H "Authorization: Bearer wh_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{"event":"patient.admitted","patient_id":"pat_00000000_01"}' \
  https://api.while.health/v1/webhooks/trigger-mock-event | jq .
```

The **202** response includes `connection_id` and `envelope_preview` showing the payload While will POST to your URL.

You can also use onboarding **Step 4** (“Send test webhook”) or the [Sandbox](/docs/sandbox) guide for a dashboard-driven test.

### 5. Confirm delivery

- Your server logs or application should show the incoming POST with a valid signature.
- The While dashboard **Messages** view lists ingested events after successful delivery.

If delivery fails, check that your URL is reachable over HTTPS, returns 2xx, and that signature verification uses the **raw body** exactly as received.

## Event payload

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

`api.request` events may also include `method`, `path`, `status_code`, and `latency_ms` when While records control plane API activity.

## Event types

**Clinical (sandbox mock)**

| Event | Description |
|-------|-------------|
| `patient.created` | Synthetic patient record |
| `patient.updated` | Patient demographics changed |
| `patient.admitted` | Inpatient admission |
| `patient.discharged` | Discharge event |
| `encounter.created` | New encounter |
| `observation.created` | Lab result or vital sign |

**Tunnel (simulated Sidecar connectivity)**

| Event | Description |
|-------|-------------|
| `tunnel.connected` | Tunnel established |
| `tunnel.disconnected` | Tunnel lost |
| `tunnel.handshake` | WireGuard handshake |
| `tunnel.health` | Health check |
| `tunnel.latency` | Latency sample |
| `tunnel.reconnect` | Reconnection |

**Control plane**

| Event | Description |
|-------|-------------|
| `api.request` | Successful sandbox API call (for example `GET /v1/patients/{id}`) |

**Not yet implemented:** webhook retry/replay queues.

## Related docs

- [Onboarding](/docs/onboarding) — where you receive your webhook secret
- [Sandbox](/docs/sandbox) — triggering test events and sandbox prerequisites
- [Error Codes](/docs/error-codes) — missing URL/secret and signature failures
