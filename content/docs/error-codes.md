---
title: Error Codes
description: HTTP status codes and error responses from the While API.
---

# Error Codes

The control plane (ultra-a FastAPI) uses standard HTTP status codes. Errors return a JSON `detail` string.

## Control plane errors

| Condition | HTTP | Detail |
|-----------|------|--------|
| Invalid/missing bearer token | 401 | Unauthorized |
| Token prefix ≠ DB environment | 401 | Unauthorized |
| `wh_live_*` on sandbox-only org | 403 | Live environment not provisioned for this organization. |
| Live key on sandbox-only route | 403 | This endpoint requires a sandbox API key (wh_test_*). |
| Patient not found (invalid ID format) | 404 | Patient not found |
| Webhook URL not configured | 422 | Webhook URL not configured. Set a destination in Settings → Webhook URL. |
| Webhook secret missing | 422 | Webhook secret not configured. |

## Dashboard webhook receiver

| Condition | HTTP | Message |
|-----------|------|---------|
| Invalid signature | 401 | Invalid webhook signature |
| Missing org_id | 400 | Missing org_id in payload |

## Troubleshooting

1. Confirm your API key prefix matches the intended environment
2. Check **Settings → Webhook URL** is configured before triggering test webhooks
3. Use `GET /v1/sandbox/catalog` to verify org-scoped patient IDs and example payloads
4. Review the onboarding wizard code snippets for working curl examples
