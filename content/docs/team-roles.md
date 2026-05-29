---
title: Team & Roles
description: Organization membership and role definitions.
---

# Team & Roles

While uses **Better Auth** with the organization plugin for multi-tenant team management.

## Roles

| Dashboard label | Better Auth role | Access (Phase 1) |
|-----------------|------------------|------------------|
| Owner | `owner` | Full access |
| Developer | `member` | Full access |
| Manager | `admin` | Full access |

All three roles have **equivalent permissions** until role-based access control (RBAC) is defined in a future release.

## Invitations

Owners can invite teammates from **Settings → Team** or during onboarding step 5.

In development, invitation emails are not sent — invite links are logged to the server console and displayed in the Settings UI.

Accept invitations at `/accept-invitation/{id}` after signing in.

## Organization linking

Better Auth stores organizations in the `organization` table. The machine plane uses `organizations` (plural) with the **same UUID** for API key and webhook provisioning.
