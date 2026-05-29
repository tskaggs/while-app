---
title: Environments
description: Understand Sandbox vs Live environments and when to use each.
---

# Environments

While provides isolated environments for integration development and production.

## Sandbox

- Synthetic FHIR data from the **control plane** — no real PHI
- API keys use the `wh_test_*` prefix
- Every account includes a **While Sandbox** system connection (`conn-sa-{org_id}`)
- The system sandbox has **no live twin** and cannot be deleted (it can be hidden via the Connections filter)
- Ideal for onboarding, webhook testing, and first API calls

## Live

- Production EHR connections via isolated Sidecars
- API keys use the `wh_live_*` prefix (when provisioned)
- Requires signed BAA and clinic connectivity
- Orgs start with `metadata.has_live: false` until live keys are provisioned

## Key prefix vs dashboard switcher

The **environment switcher** in the navbar filters dashboard views (connections, metrics, logs). The control plane determines environment from your **Bearer token prefix**:

- `wh_test_*` → sandbox
- `wh_live_*` → live

Never use live keys against sandbox endpoints or vice versa.

## System sandbox connection

| Property | Value |
|----------|-------|
| Name | While Sandbox |
| Type | `system_sandbox` |
| Live twin | None (permanent) |
| Deletable | No |
| Hideable | Yes — Connections filter |

Partner clinic connections (created via Support) follow the normal sandbox ↔ live pairing model.
