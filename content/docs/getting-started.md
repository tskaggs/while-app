---
title: Getting Started
description: Connect to While and make your first FHIR API call in minutes.
---

# Getting Started

While helps healthcare companies connect to EMR and EHR systems through isolated, secure Sidecar instances. No PHI ever enters the control plane.

## Quick Start

1. **Sign up** at `/signup` — create your account and organization
2. Complete the **onboarding wizard** — receive your sandbox API key (shown once), webhook secret, and connection ID
3. **Test the API** — fetch synthetic FHIR Patient data from the control plane sandbox
4. Use the **While Sandbox** system connection in the dashboard (sandbox-only, no live twin)
5. Request partner connections via **Support** when ready for clinic integrations
6. Switch to **Live** when production sidecars are activated

## Dashboard authentication

Operator sign-in uses **Better Auth** (email + password) at `/login`. Machine API access uses Bearer tokens provisioned during onboarding.

## Control plane API authentication

All control plane API requests require a Bearer token against `https://api.while.health`:

```bash
# List sample patient IDs for your org
curl -s -H "Authorization: Bearer wh_test_your_key" \
  https://api.while.health/v1/patients | jq .

# Fetch a synthetic FHIR Patient
curl -s -H "Authorization: Bearer wh_test_your_key" \
  https://api.while.health/v1/patients/pat_00000000_01 | jq .

# Onboarding metadata (connection ID, example payloads)
curl -s -H "Authorization: Bearer wh_test_your_key" \
  https://api.while.health/v1/sandbox/catalog | jq .
```

## Environments

| Environment | Key prefix | Purpose |
|-------------|------------|---------|
| Sandbox | `wh_test_*` | Synthetic FHIR + webhooks via control plane |
| Live | `wh_live_*` | Production integrations (when provisioned) |

The dashboard environment switcher filters your **view** of connections and metrics. The API key prefix determines which environment the control plane enforces.

See [Environments](/docs/environments), [Sandbox](/docs/sandbox), and [Onboarding](/docs/onboarding) for details.
