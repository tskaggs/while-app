---
title: FHIR Resources
description: FHIR R4 resources supported by While integrations.
---

# FHIR Resources

While normalizes all inbound data to **FHIR R4**. Legacy HL7 v2 messages are automatically mapped inside the Sidecar.

## Supported Resources

| Resource | Read | Write | HL7 Source |
|----------|------|-------|------------|
| Patient | ✓ | ✓ | ADT^A01, ADT^A08 |
| Observation | ✓ | ✓ | ORU^R01 |
| Encounter | ✓ | ✓ | ADT^A01, ADT^A03 |
| DiagnosticReport | ✓ | — | ORU^R01 |
| MedicationRequest | ✓ | ✓ | RDE^O11 |
| Condition | ✓ | — | ADT^A08 |

## Example Patient Response

```json
{
  "resourceType": "Patient",
  "id": "example",
  "name": [{ "family": "Smith", "given": ["John"] }],
  "gender": "male",
  "birthDate": "1985-03-15",
  "identifier": [{
    "system": "http://hospital.example/mrn",
    "value": "4829103"
  }]
}
```

## Code Systems

While preserves standard medical code systems:

- **LOINC** for lab observations
- **SNOMED CT** for conditions and procedures
- **RxNorm** for medications
