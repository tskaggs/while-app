import { prisma } from '../lib/prisma'
import {
  catalogVersion,
  computeMappingCompletion,
  defaultMappingsFromCatalog,
  getCatalogFields,
  buildMappingApiPayload,
  type SandboxProfileInput
} from './ehrFieldCatalog'

export async function loadOrgSandboxProfile(orgId: string) {
  return prisma.orgSandboxProfile.findUnique({ where: { orgId } })
}

export async function upsertOrgSandboxProfile(orgId: string, input: SandboxProfileInput) {
  return prisma.orgSandboxProfile.upsert({
    where: { orgId },
    create: {
      orgId,
      ehrVendor: input.ehrVendor ?? 'Other',
      dataFormat: input.dataFormat ?? 'fhir',
      resourceTypes: input.resourceTypes ?? ['Patient'],
      suggestedFieldsVersion: catalogVersion
    },
    update: {
      ehrVendor: input.ehrVendor,
      dataFormat: input.dataFormat,
      resourceTypes: input.resourceTypes,
      suggestedFieldsVersion: catalogVersion
    }
  })
}

export async function seedConnectionMappings(
  orgId: string,
  connectionId: string,
  profile: SandboxProfileInput
) {
  const existing = await prisma.connectionFieldMapping.count({ where: { connectionId } })
  if (existing > 0) return

  const rows = defaultMappingsFromCatalog(orgId, connectionId, profile)
  if (!rows.length) return

  await prisma.connectionFieldMapping.createMany({ data: rows })
}

export async function getConnectionMappingBundle(orgId: string, connectionId: string) {
  const [profile, mappings, requiredData] = await Promise.all([
    loadOrgSandboxProfile(orgId),
    prisma.connectionFieldMapping.findMany({
      where: { connectionId, orgId },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.connectionRequiredData.findUnique({ where: { connectionId } })
  ])

  const ehrVendor = profile?.ehrVendor ?? 'Other'
  const dataFormat = profile?.dataFormat ?? 'fhir'
  const catalog = getCatalogFields(ehrVendor, dataFormat)
  const suggestions = catalog.filter(
    field => !mappings.some(m => m.sourcePath === field.sourcePath)
  )

  const mappingRows = mappings.map(m => ({
    sourcePath: m.sourcePath,
    targetFhirPath: m.targetFhirPath,
    status: m.status,
    isRequired: m.isRequired
  }))

  return {
    profile,
    mappings,
    requiredData,
    catalog,
    suggestions,
    completion: computeMappingCompletion(mappings),
    apiPayload: buildMappingApiPayload(connectionId, profile, mappingRows)
  }
}

export async function saveConnectionMappings(
  orgId: string,
  connectionId: string,
  rows: Array<{
    sourcePath: string
    targetFhirPath: string
    status?: string
    isRequired?: boolean
    sortOrder?: number
  }>
) {
  await prisma.$transaction(async (tx) => {
    await tx.connectionFieldMapping.deleteMany({ where: { connectionId, orgId } })
    if (rows.length) {
      await tx.connectionFieldMapping.createMany({
        data: rows.map((row, index) => ({
          orgId,
          connectionId,
          sourcePath: row.sourcePath,
          targetFhirPath: row.targetFhirPath,
          status: row.status ?? 'mapped',
          isRequired: row.isRequired ?? false,
          sortOrder: row.sortOrder ?? index + 1
        }))
      })
    }
  })

  const connection = await prisma.dashboardConnection.findUnique({ where: { id: connectionId } })
  if (connection?.pairedConnectionId) {
    const bundle = await getConnectionMappingBundle(orgId, connectionId)
    if (bundle.completion.complete) {
      const { maybeEnqueueLiveVm } = await import('./provisioningWorker')
      await maybeEnqueueLiveVm(orgId, connection.pairedConnectionId)
    }
  }

  return getConnectionMappingBundle(orgId, connectionId)
}

export async function saveConnectionRequiredData(
  orgId: string,
  connectionId: string,
  input: {
    ehrEndpoint?: string | null
    ehrVendor?: string | null
    customFields?: Record<string, unknown>
    markComplete?: boolean
  }
) {
  const data = await prisma.connectionRequiredData.upsert({
    where: { connectionId },
    create: {
      connectionId,
      orgId,
      ehrEndpoint: input.ehrEndpoint ?? null,
      ehrVendor: input.ehrVendor ?? null,
      customFields: (input.customFields ?? {}) as object,
      completedAt: input.markComplete ? new Date() : null
    },
    update: {
      ehrEndpoint: input.ehrEndpoint ?? undefined,
      ehrVendor: input.ehrVendor ?? undefined,
      customFields: input.customFields ? (input.customFields as object) : undefined,
      completedAt: input.markComplete ? new Date() : undefined
    }
  })

  if (input.ehrEndpoint) {
    await prisma.dashboardConnection.update({
      where: { id: connectionId },
      data: {
        ehrEndpoint: input.ehrEndpoint,
        ehrVendor: input.ehrVendor ?? undefined
      }
    })
  }

  const connection = await prisma.dashboardConnection.findUnique({ where: { id: connectionId } })
  if (connection?.pairedConnectionId && input.markComplete) {
    const { maybeEnqueueLiveVm } = await import('./provisioningWorker')
    await maybeEnqueueLiveVm(orgId, connection.pairedConnectionId)
  }

  return data
}

export function deriveFlightCheckFromMapping(
  tunnelStatus: string,
  completion: ReturnType<typeof computeMappingCompletion>,
  requiredDataComplete: boolean,
  connectionType?: string
) {
  const isSystemSandbox = connectionType === 'system_sandbox'
  const requiredOk = isSystemSandbox || requiredDataComplete
  return {
    mtu: tunnelStatus === 'active',
    handshake: tunnelStatus === 'active' || tunnelStatus === 'pending',
    hl7Ack: completion.complete && requiredOk
  }
}

const PROVISIONING_STAGE_ORDER = [
  'queued',
  'vm_create',
  'wireguard',
  'sidecar_boot',
  'health_check',
  'completed'
] as const

/** Stage-aware flight checks while a VM job is still running. */
export function deriveFlightCheckFromProvisioning(
  stage: string | undefined,
  tunnelStatus: string,
  completion: ReturnType<typeof computeMappingCompletion>,
  requiredDataComplete: boolean,
  connectionType?: string
) {
  if (
    tunnelStatus === 'active'
    || stage === 'completed'
    || !stage
  ) {
    return deriveFlightCheckFromMapping(
      tunnelStatus,
      completion,
      requiredDataComplete,
      connectionType
    )
  }

  const stageIndex = PROVISIONING_STAGE_ORDER.indexOf(stage as typeof PROVISIONING_STAGE_ORDER[number])
  const isSystemSandbox = connectionType === 'system_sandbox'
  const requiredOk = isSystemSandbox || requiredDataComplete

  return {
    mtu: stageIndex >= PROVISIONING_STAGE_ORDER.indexOf('sidecar_boot'),
    handshake: stageIndex >= PROVISIONING_STAGE_ORDER.indexOf('wireguard'),
    hl7Ack:
      stageIndex >= PROVISIONING_STAGE_ORDER.indexOf('health_check')
      && completion.complete
      && requiredOk
  }
}
