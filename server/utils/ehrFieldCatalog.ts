import catalog from '../data/ehr-field-catalog.json'

export interface CatalogField {
  sourcePath: string
  targetFhirPath: string
  label: string
  required: boolean
  description: string
}

export interface SandboxProfileInput {
  ehrVendor?: string
  dataFormat?: string
  resourceTypes?: string[]
}

export function getCatalogFields(ehrVendor: string, dataFormat: string): CatalogField[] {
  const vendor = catalog.vendors[ehrVendor as keyof typeof catalog.vendors]
    ?? catalog.vendors.Other

  if (dataFormat === 'both') {
    return [...(vendor.hl7 ?? []), ...(vendor.fhir ?? [])]
  }

  const key = dataFormat === 'hl7' ? 'hl7' : 'fhir'
  return vendor[key as 'hl7' | 'fhir'] ?? vendor.fhir ?? []
}

export function defaultMappingsFromCatalog(
  orgId: string,
  connectionId: string,
  profile: SandboxProfileInput
) {
  const fields = getCatalogFields(profile.ehrVendor ?? 'Other', profile.dataFormat ?? 'fhir')

  return fields.map((field, index) => ({
    orgId,
    connectionId,
    sourcePath: field.sourcePath,
    targetFhirPath: field.targetFhirPath,
    status: field.required ? 'mapped' : 'suggested',
    isRequired: field.required,
    sortOrder: index + 1
  }))
}

export function computeMappingCompletion(
  mappings: Array<{ status: string, isRequired: boolean }>
) {
  const required = mappings.filter(m => m.isRequired)
  const confirmed = mappings.filter(m => m.status === 'mapped' || m.status === 'review')
  const requiredConfirmed = required.filter(m => m.status === 'mapped')

  return {
    total: mappings.length,
    confirmed: confirmed.length,
    requiredTotal: required.length,
    requiredConfirmed: requiredConfirmed.length,
    complete: required.length === 0 || requiredConfirmed.length === required.length
  }
}

export function buildMappingApiPayload(
  connectionId: string,
  profile: { ehrVendor?: string | null, dataFormat?: string | null, resourceTypes?: unknown } | null,
  mappings: Array<{
    sourcePath: string
    targetFhirPath: string
    status: string
    isRequired: boolean
  }>
) {
  const resourceTypes = profile?.resourceTypes
  return {
    connection_id: connectionId,
    ehr_vendor: profile?.ehrVendor ?? 'Other',
    data_format: profile?.dataFormat ?? 'fhir',
    resource_types: Array.isArray(resourceTypes) ? resourceTypes : ['Patient'],
    field_mappings: mappings.map(m => ({
      source_path: m.sourcePath,
      target_fhir_path: m.targetFhirPath,
      status: m.status,
      is_required: m.isRequired
    }))
  }
}

export const catalogVersion = catalog.version
