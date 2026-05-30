import { prisma } from '../lib/prisma'
import { defaultConnectionId, generateWireguardPublicKey, orgShortId, sandboxSidecarId } from './provisionOrg'
import { seedConnectionMappings } from './connectionMapping'
import { ensureWireguardPeer } from './wireguard'

export async function enqueueProvisioningJob(orgId: string, connectionId: string, jobType: string) {
  return prisma.provisioningJob.upsert({
    where: { connectionId },
    create: {
      orgId,
      connectionId,
      jobType,
      status: 'queued'
    },
    update: {
      status: 'queued',
      errorMessage: null,
      startedAt: null,
      completedAt: null
    }
  })
}

export async function processProvisioningJob(jobId: string) {
  const job = await prisma.provisioningJob.findUnique({ where: { id: jobId } })
  if (!job || job.status === 'completed') return job

  await prisma.provisioningJob.update({
    where: { id: jobId },
    data: { status: 'running', startedAt: new Date() }
  })

  try {
    const vmId = sandboxSidecarId(job.orgId)
    await ensureWireguardPeer(job.orgId, job.connectionId)

    await prisma.dashboardConnection.update({
      where: { id: job.connectionId },
      data: {
        sidecarId: vmId,
        provisioningStatus: 'active',
        tunnelStatus: 'active'
      }
    })

    return await prisma.provisioningJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        vmId,
        completedAt: new Date()
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provisioning failed'
    await prisma.dashboardConnection.update({
      where: { id: job.connectionId },
      data: { provisioningStatus: 'error' }
    })
    return await prisma.provisioningJob.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage: message, completedAt: new Date() }
    })
  }
}

export async function createPartnerConnectionFromRequest(requestId: string) {
  const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
  if (!request) {
    throw createError({ statusCode: 404, message: 'Connection request not found' })
  }

  const shortId = orgShortId(request.orgId).slice(0, 4)
  const connectionId = `conn-${request.environment === 'live' ? 'li' : 'sa'}-${shortId}-${Date.now().toString(36).slice(-4)}`

  await prisma.$transaction(async (tx) => {
    await tx.dashboardConnection.create({
      data: {
        id: connectionId,
        orgId: request.orgId,
        name: request.partnerName,
        connectionType: 'partner',
        environment: request.environment,
        isDeletable: true,
        isHidden: false,
        sidecarId: `fc-${connectionId}`,
        tunnelStatus: 'pending',
        wireguardPublicKey: generateWireguardPublicKey(request.orgId),
        ehrEndpoint: 'Pending customer configuration',
        ehrVendor: request.ehrVendor,
        region: 'control-plane',
        provisioningStatus: 'provisioning'
      }
    })

    await tx.connectionRequest.update({
      where: { id: requestId },
      data: { status: 'provisioning', connectionId }
    })
  })

  await seedConnectionMappings(request.orgId, connectionId, {
    ehrVendor: request.ehrVendor,
    dataFormat: request.dataFormat,
    resourceTypes: request.resourceTypes as string[]
  })

  const job = await enqueueProvisioningJob(request.orgId, connectionId, 'partner_connection')
  await processProvisioningJob(job.id)

  return prisma.connectionRequest.findUnique({ where: { id: requestId } })
}

export async function provisionAccountSandboxVm(orgId: string) {
  const connectionId = defaultConnectionId(orgId)
  const job = await enqueueProvisioningJob(orgId, connectionId, 'account_sandbox')
  return processProvisioningJob(job.id)
}
