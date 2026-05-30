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

Invitees receive an email with a link to accept. You can also copy pending invite links from **Settings → Team**.

Accept invitations at `/accept-invitation/{id}` after signing in.

## Organization linking

Your dashboard organization is linked to your control plane organization ID, which scopes API keys, webhooks, and sandbox data to your account.
