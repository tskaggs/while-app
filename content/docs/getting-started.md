---
title: Getting Started
description: Connect to While and make your first FHIR API call in minutes.
---

# Getting Started

While helps healthcare companies connect to EMR and EHR systems through isolated, secure Sidecar instances. No PHI ever enters the control plane.

## Quick Start

1. Create an account and obtain your API keys from **Settings**
2. Start in **Sandbox** to test with mock EHR endpoints
3. Request connection support for your first healthcare partner
4. Switch to **Live** when ready for production

## Authentication

All API requests require a Bearer token:

```bash
curl -H "Authorization: Bearer wh_test_your_key" \
  https://api.while.health/v1/patients
```

## Environments

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Sandbox | `https://sandbox.api.while.health` | Testing with mock data |
| Live | `https://api.while.health` | Production integrations |

Use the environment switcher in the dashboard to toggle your view between Sandbox and Live configurations.
