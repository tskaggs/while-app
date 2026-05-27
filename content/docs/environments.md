---
title: Environments
description: Understand Sandbox vs Live environments and when to use each.
---

# Environments

While provides two isolated environments for every integration.

## Sandbox

- Mock EHR endpoints — no real PHI
- Free to use for development and demos
- Sidecars provisioned instantly
- Ideal for mapping development and webhook testing

## Live

- Production EHR connections
- Requires signed BAA
- Hardware-isolated Sidecar per partner
- WireGuard tunnel to clinic gateway

## Switching Environments

Use the **Environment Switcher** in the dashboard navbar. API keys are environment-specific:

- `wh_test_*` — Sandbox
- `wh_live_*` — Live

Never use live keys in sandbox or vice versa.
