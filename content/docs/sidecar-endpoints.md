---
title: Sidecar Endpoints
description: API endpoints exposed by your isolated While Sidecar instances.
---

# Sidecar Endpoints

Each healthcare partner gets a dedicated Sidecar — a hardware-isolated micro-VM that handles data translation and secure tunneling.

## Architecture

```
Your App → While Control Plane → Sidecar VM → WireGuard → Clinic EHR
```

PHI flows only through the Sidecar. The control plane (dashboard, API keys, billing) never sees patient data.

## Sidecar API

Once a tunnel is active, query the Sidecar directly:

```bash
# Read a FHIR Patient resource
GET https://sidecar-{id}.while.me/Patient/{id}
Authorization: Bearer wh_live_your_key
```

## Available Resources

- `GET /Patient/{id}` — Read patient demographics
- `GET /Observation?patient={id}` — Lab results and vitals
- `GET /Encounter?patient={id}` — Visit history
- `POST /Patient` — Create patient (write scope required)

All responses are native **FHIR R4** JSON.

## Webhooks

Configure your webhook URL in Settings. While delivers normalized FHIR bundles to your endpoint with HMAC signature verification.

```json
{
  "event": "patient.created",
  "resource": { "resourceType": "Patient", "id": "..." },
  "connection_id": "conn-lv-001",
  "timestamp": "2026-05-20T14:55:00Z"
}
```
