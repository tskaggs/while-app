import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma'
import { defaultConnectionId, generateWireguardPublicKey, orgShortId } from './provisionOrg'
import { provisionConnectionSandboxCredentials } from './connectionCredentials'
import { seedConnectionMappings } from './connectionMapping'
import { enqueueProvisioningJob } from './provisioningWorker'
import { vmIdForConnection } from './vmIds'

export interface ConnectionPairInput {
  orgId: string
  name: string
  ehrVendor: string
  dataFormat?: string
  resourceTypes?: string[]
  connectionType?: string
  region?: string
}

export interface ConnectionPairResult {
  sandboxConnectionId: string
  liveConnectionId: string
  credentials?: {
    sandboxApiKey: string
    webhookSecret: string
    webhookUrl: string | null
  } | null
}

function pairSuffix(orgId: string) {
  return `${orgShortId(orgId).slice(0, 4)}-${Date.now().toString(36).slice(-4)}-${randomBytes(2).toString('hex')}`
}

export async function createConnectionPair(input: ConnectionPairInput): Promise<ConnectionPairResult> {
  const suffix = pairSuffix(input.orgId)
  const sandboxConnectionId = `conn-sa-${suffix}`
  const liveConnectionId = `conn-li-${suffix}`

  let credentials: ConnectionPairResult['credentials'] = null

  await prisma.$transaction(async (tx) => {
    await tx.dashboardConnection.create({
      data: {
        id: sandboxConnectionId,
        orgId: input.orgId,
        name: `${input.name} (Sandbox)`,
        connectionType: input.connectionType ?? 'partner',
        environment: 'sandbox',
        pairedConnectionId: liveConnectionId,
        isDeletable: true,
        isHidden: false,
        sidecarId: vmIdForConnection(sandboxConnectionId, 'sandbox'),
        tunnelStatus: 'pending',
        wireguardPublicKey: generateWireguardPublicKey(input.orgId),
        ehrEndpoint: 'Pending customer configuration',
        ehrVendor: input.ehrVendor,
        region: input.region ?? 'control-plane',
        provisioningStatus: 'provisioning'
      }
    })

    await tx.dashboardConnection.create({
      data: {
        id: liveConnectionId,
        orgId: input.orgId,
        name: `${input.name} (Live)`,
        connectionType: input.connectionType ?? 'partner',
        environment: 'live',
        pairedConnectionId: sandboxConnectionId,
        isDeletable: true,
        isHidden: false,
        sidecarId: vmIdForConnection(liveConnectionId, 'live'),
        tunnelStatus: 'pending',
        wireguardPublicKey: generateWireguardPublicKey(input.orgId),
        ehrEndpoint: 'Pending customer configuration',
        ehrVendor: input.ehrVendor,
        region: input.region ?? 'control-plane',
        provisioningStatus: 'ready'
      }
    })

    credentials = await provisionConnectionSandboxCredentials(
      input.orgId,
      sandboxConnectionId,
      tx
    )
  })

  await seedConnectionMappings(input.orgId, sandboxConnectionId, {
    ehrVendor: input.ehrVendor,
    dataFormat: input.dataFormat ?? 'fhir',
    resourceTypes: input.resourceTypes ?? ['Patient']
  })

  await seedConnectionMappings(input.orgId, liveConnectionId, {
    ehrVendor: input.ehrVendor,
    dataFormat: input.dataFormat ?? 'fhir',
    resourceTypes: input.resourceTypes ?? ['Patient']
  })

  await enqueueProvisioningJob(input.orgId, sandboxConnectionId, 'partner_connection', 'sandbox')

  return { sandboxConnectionId, liveConnectionId, credentials }
}

export async function createPartnerConnectionFromRequest(requestId: string) {
  const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
  if (!request) {
    throw createError({ statusCode: 404, message: 'Connection request not found' })
  }

  const pair = await createConnectionPair({
    orgId: request.orgId,
    name: request.partnerName,
    ehrVendor: request.ehrVendor,
    dataFormat: request.dataFormat,
    resourceTypes: request.resourceTypes as string[]
  })

  await prisma.connectionRequest.update({
    where: { id: requestId },
    data: {
      status: 'provisioning',
      connectionId: pair.sandboxConnectionId
    }
  })

  return prisma.connectionRequest.findUnique({ where: { id: requestId } })
}

export async function provisionAccountSandboxVm(orgId: string) {
  const connectionId = defaultConnectionId(orgId)

  await prisma.dashboardConnection.update({
    where: { id: connectionId },
    data: {
      provisioningStatus: 'provisioning',
      tunnelStatus: 'pending',
      sidecarId: vmIdForConnection(connectionId, 'sandbox')
    }
  })

  return enqueueProvisioningJob(orgId, connectionId, 'account_sandbox', 'sandbox')
}
