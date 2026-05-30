---
title: Webhooks
description: Configure org defaults and per-connection webhook overrides, verify signed deliveries, and receive FHIR events from While.
---

# Webhooks

While delivers normalized FHIR R4 events to an **HTTPS endpoint you configure**. Each delivery is signed with a **webhook secret** so you can verify it came from While before processing.

## Two-tier configuration

Webhook URL and secret use **org defaults** with optional **per-connection overrides**. A `null` override means inherit the org default.

| Field | Org default (`Settings`) | Connection override (`Test` tab) |
|-------|--------------------------|----------------------------------|
| URL | Default webhook destination | Optional custom URL |
| Secret | From onboarding (`whsec_*`) | Optional custom secret (rotate on Test tab) |

**Effective values** (used by ultra-a delivery and signature verification):

```
effective_url    = connection.webhook_url ?? org.webhook_url
effective_secret = connection.webhook_secret ?? org.webhook_secret
```

### Integration patterns

| Pattern | Setup | How to route |
|---------|-------|--------------|
| **One app, many connections** | Set org URL + secret in Settings only; leave connections on “Inherit org default” | Single endpoint; use `connection_id` in each payload |
| **One app per connection** | Set custom URL + secret on each connection’s Test page | Each connection POSTs to its own app with its own secret |
| **Mixed** | Org default for most connections; override specific rows | ultra-a resolves per event from `connection_id` |

## Where settings live

| Credential / setting | Where to find it |
|----------------------|------------------|
| **Org default webhook URL** | **Settings → Default webhook destination** |
| **Connection webhook URL / secret** | Connection **Test** tab (inherit toggle, override fields, rotate secret) |
| **Org webhook secret** | Onboarding **Step 2 — Sandbox credentials** (shown **once**, `whsec_*`) |
| **Connection ID** | Overview, Test tab, or `connection_id` in each webhook payload |
| **Sandbox API key** | Onboarding Step 2 (shown once, `wh_test_*`) — used to **trigger** test events, not to verify inbound webhooks |

Save webhook secrets when they are displayed. Plaintext secrets are not shown again after save (connection overrides can be rotated on the Test tab).

## How to use webhooks

### 1. Set your org default webhook URL

In the dashboard, open **Settings → Default webhook destination** and enter a public **HTTPS** endpoint your application controls, for example:

```
https://your-app.com/webhooks/while
```

This URL applies to **all connections that inherit the org default**. The target connection is identified inside each payload by `connection_id` (for example `conn-sa-{org_short_id}` for the system sandbox).

To send a specific connection’s events elsewhere, open that connection’s **Test** tab, turn off **Inherit org default**, and save a connection URL (and optional connection secret).

### 2. Store your webhook secret

During onboarding **Step 2**, copy the **Webhook secret** (`whsec_…`) alongside your sandbox API key. You need the **effective** secret for each connection on your server to verify `X-While-Signature`.

Treat secrets like passwords: store them in a secrets manager or environment variable (for example `WHILE_WEBHOOK_SECRET`), not in client-side code or source control.

### 3. Implement a signed webhook receiver

Your endpoint must:

1. Read the **raw request body** as bytes or a string **before** parsing JSON.
2. Compute HMAC-SHA256 of that raw body using your webhook secret (org default or per-connection, matching how the connection is configured in While).
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

Use your sandbox API key to queue a mock event. While delivers it to the **effective** URL for the system sandbox connection (org default unless overridden):

```bash
curl -s -X POST \
  -H "Authorization: Bearer wh_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{"event":"patient.admitted","patient_id":"pat_00000000_01"}' \
  https://api.while.health/v1/webhooks/trigger-mock-event | jq .
```

The **202** response includes `connection_id` and `envelope_preview` showing the payload While will POST to your URL.

You can also use onboarding **Step 4**, a connection **Test** tab (“Send test webhook”), or the [Sandbox](/docs/sandbox) guide for a dashboard-driven test.

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

- [Onboarding](/docs/onboarding) — where you receive your org webhook secret
- [Sandbox](/docs/sandbox) — triggering test events and sandbox prerequisites
- [Error Codes](/docs/error-codes) — missing URL/secret and signature failures
