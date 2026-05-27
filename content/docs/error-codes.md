---
title: Error Codes
description: HTTP status codes and error responses from the While API.
---

# Error Codes

While uses standard HTTP status codes with structured error responses.

## Error Format

```json
{
  "error": {
    "code": "tunnel_disconnected",
    "message": "WireGuard tunnel to clinic gateway is unreachable",
    "connection_id": "conn-lv-003",
    "retry_after": 30
  }
}
```

## Common Errors

| Code | HTTP | Description |
|------|------|-------------|
| `unauthorized` | 401 | Invalid or missing API key |
| `forbidden` | 403 | Insufficient scope for this resource |
| `not_found` | 404 | Resource or connection not found |
| `tunnel_disconnected` | 502 | Sidecar tunnel to EHR is down |
| `mapping_error` | 422 | HL7-to-FHIR mapping failed |
| `rate_limited` | 429 | Too many requests — check `retry_after` |
| `internal_error` | 500 | Sidecar internal error — check logs |

## Troubleshooting

1. Check **Connection Health** on the dashboard
2. Run the **Flight Check** on the connection detail page
3. Review **Integration Logs** with PHI anonymization enabled
4. Submit a **Connection Support** request if the tunnel remains down
