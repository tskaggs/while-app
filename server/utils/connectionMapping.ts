import { prisma } from '../lib/prisma'
import {
  catalogVersion,
  computeMappingCompletion,
  defaultMappingsFromCatalog,
  getCatalogFields,
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
  const suggestions = getCatalogFields(ehrVendor, dataFormat).filter(
    field => !mappings.some(m => m.sourcePath === field.sourcePath)
  )

  return {
    profile,
    mappings,
    requiredData,
    suggestions,
    completion: computeMappingCompletion(mappings)
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

  return data
}

export function deriveFlightCheckFromMapping(
  tunnelStatus: string,
  completion: ReturnType<typeof computeMappingCompletion>,
  requiredDataComplete: boolean
) {
  return {
    mtu: tunnelStatus === 'active',
    handshake: tunnelStatus === 'active' || tunnelStatus === 'pending',
    hl7Ack: completion.complete && requiredDataComplete
  }
}
