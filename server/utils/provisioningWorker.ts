import { prisma } from '../lib/prisma'
import type { ProvisioningStage } from './orchestratorClient'
import {
  createOrchestratorVm,
  getOrchestratorVm,
  healthCheckOrchestratorVm
} from './orchestratorClient'
import {
  deriveFlightCheckFromMapping,
  getConnectionMappingBundle
} from './connectionMapping'
import { vmIdForConnection } from './vmIds'
import { emitProvisioningEvent } from './provisioningEvents'

const STAGE_PROGRESS: Record<ProvisioningStage, number> = {
  queued: 0,
  vm_create: 15,
  wireguard: 40,
  sidecar_boot: 70,
  health_check: 90,
  completed: 100,
  failed: 0
}

export async function enqueueProvisioningJob(
  orgId: string,
  connectionId: string,
  jobType: string,
  environment: 'sandbox' | 'live' = 'sandbox'
) {
  const vmId = vmIdForConnection(connectionId, environment)
  return prisma.provisioningJob.upsert({
    where: {
      connectionId_environment: { connectionId, environment }
    },
    create: {
      orgId,
      connectionId,
      environment,
      jobType,
      status: 'queued',
      stage: 'queued',
      vmId,
      progressPercent: 0
    },
    update: {
      status: 'queued',
      stage: 'queued',
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      progressPercent: 0,
      vmId
    }
  })
}

async function updateJobStage(
  jobId: string,
  stage: ProvisioningStage,
  extra?: { status?: string, orchestratorVmId?: string, errorMessage?: string }
) {
  const job = await prisma.provisioningJob.update({
    where: { id: jobId },
    data: {
      stage,
      progressPercent: STAGE_PROGRESS[stage] ?? 0,
      ...(extra?.status ? { status: extra.status } : {}),
      ...(extra?.orchestratorVmId ? { orchestratorVmId: extra.orchestratorVmId } : {}),
      ...(extra?.errorMessage ? { errorMessage: extra.errorMessage } : {})
    }
  })

  emitProvisioningEvent(job.connectionId, {
    jobId: job.id,
    connectionId: job.connectionId,
    environment: job.environment,
    stage,
    progressPercent: job.progressPercent,
    status: job.status
  })

  return job
}

async function applyWireguardFromOrchestrator(
  orgId: string,
  connectionId: string,
  environment: string,
  vm: {
    wireguard_public_key?: string | null
    wireguard_private_key_ref?: string | null
    wireguard_endpoint?: string | null
    wireguard_listen_port?: number | null
  }
) {
  if (!vm.wireguard_public_key) return

  await prisma.connectionWireguardPeer.upsert({
    where: { connectionId },
    create: {
      connectionId,
      orgId,
      environment,
      publicKey: vm.wireguard_public_key,
      privateKeyRef: vm.wireguard_private_key_ref,
      endpoint: vm.wireguard_endpoint,
      listenPort: vm.wireguard_listen_port,
      peerConfig: {
        interface: 'wg0',
        address: '10.8.0.2/32'
      }
    },
    update: {
      publicKey: vm.wireguard_public_key,
      privateKeyRef: vm.wireguard_private_key_ref,
      endpoint: vm.wireguard_endpoint,
      listenPort: vm.wireguard_listen_port
    }
  })

  await prisma.dashboardConnection.update({
    where: { id: connectionId },
    data: { wireguardPublicKey: vm.wireguard_public_key }
  })
}

async function resolveFinalProvisioningStatus(connectionId: string, orgId: string) {
  const connection = await prisma.dashboardConnection.findUnique({ where: { id: connectionId } })
  if (connection?.connectionType === 'system_sandbox') {
    return 'active' as const
  }

  const bundle = await getConnectionMappingBundle(orgId, connectionId)
  const requiredComplete = Boolean(bundle.requiredData?.completedAt || bundle.requiredData?.ehrEndpoint)
  if (bundle.completion.complete && requiredComplete) {
    return 'active' as const
  }
  return 'pending_customer' as const
}

export async function processProvisioningJob(jobId: string) {
  const job = await prisma.provisioningJob.findUnique({ where: { id: jobId } })
  if (!job || job.status === 'completed') return job

  const connection = await prisma.dashboardConnection.findUnique({ where: { id: job.connectionId } })
  if (!connection) return job

  const vmId = job.vmId ?? vmIdForConnection(job.connectionId, job.environment)

  await prisma.provisioningJob.update({
    where: { id: jobId },
    data: { status: 'running', startedAt: new Date() }
  })

  await prisma.dashboardConnection.update({
    where: { id: job.connectionId },
    data: { provisioningStatus: 'provisioning', tunnelStatus: 'pending' }
  })

  emitProvisioningEvent(job.connectionId, {
    jobId: job.id,
    connectionId: job.connectionId,
    environment: job.environment,
    stage: 'queued',
    progressPercent: 0,
    status: 'running'
  })

  try {
    await updateJobStage(jobId, 'vm_create')

    const created = await createOrchestratorVm({
      orgId: job.orgId,
      connectionId: job.connectionId,
      environment: job.environment as 'sandbox' | 'live',
      vmId
    })

    await updateJobStage(jobId, created.stage as ProvisioningStage, {
      orchestratorVmId: created.vm_id
    })

    let vm = created
    for (let i = 0; i < 30 && vm.stage !== 'completed'; i++) {
      await new Promise(r => setTimeout(r, 200))
      vm = await getOrchestratorVm(vmId)
      await updateJobStage(jobId, vm.stage as ProvisioningStage, {
        orchestratorVmId: vm.vm_id
      })
    }

    await updateJobStage(jobId, 'wireguard')
    await applyWireguardFromOrchestrator(job.orgId, job.connectionId, job.environment, vm)

    await updateJobStage(jobId, 'sidecar_boot')
    const health = await healthCheckOrchestratorVm(vmId)

    await updateJobStage(jobId, health.stage as ProvisioningStage)

    const finalStatus = health.healthy
      ? await resolveFinalProvisioningStatus(job.connectionId, job.orgId)
      : 'error'

    await prisma.dashboardConnection.update({
      where: { id: job.connectionId },
      data: {
        sidecarId: vmId,
        provisioningStatus: finalStatus,
        tunnelStatus: health.healthy ? 'active' : 'error',
        lastSyncAt: health.healthy ? new Date() : undefined
      }
    })

    const completed = await prisma.provisioningJob.update({
      where: { id: jobId },
      data: {
        status: health.healthy ? 'completed' : 'failed',
        stage: health.healthy ? 'completed' : 'failed',
        progressPercent: health.healthy ? 100 : STAGE_PROGRESS[health.stage as ProvisioningStage] ?? 0,
        vmId,
        orchestratorVmId: vm.vm_id,
        completedAt: new Date(),
        errorMessage: health.healthy ? null : 'Health check failed'
      }
    })

    emitProvisioningEvent(job.connectionId, {
      jobId: completed.id,
      connectionId: job.connectionId,
      environment: job.environment,
      stage: completed.stage as ProvisioningStage,
      progressPercent: completed.progressPercent,
      status: completed.status,
      provisioningStatus: finalStatus,
      tunnelStatus: health.healthy ? 'active' : 'error'
    })

    if (finalStatus === 'active' && connection.pairedConnectionId && job.environment === 'sandbox') {
      await maybeEnqueueLiveVm(job.orgId, connection.pairedConnectionId)
    }

    return completed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provisioning failed'
    await prisma.dashboardConnection.update({
      where: { id: job.connectionId },
      data: { provisioningStatus: 'error', tunnelStatus: 'error' }
    })
    const failed = await prisma.provisioningJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        stage: 'failed',
        errorMessage: message,
        completedAt: new Date()
      }
    })
    emitProvisioningEvent(job.connectionId, {
      jobId: failed.id,
      connectionId: job.connectionId,
      environment: job.environment,
      stage: 'failed',
      progressPercent: 0,
      status: 'failed',
      errorMessage: message
    })
    return failed
  }
}

export async function maybeEnqueueLiveVm(orgId: string, liveConnectionId: string) {
  const live = await prisma.dashboardConnection.findUnique({ where: { id: liveConnectionId } })
  if (!live || live.environment !== 'live') return null

  const bundle = await getConnectionMappingBundle(orgId, liveConnectionId)
  const sandboxPair = live.pairedConnectionId
    ? await prisma.dashboardConnection.findUnique({ where: { id: live.pairedConnectionId } })
    : null

  const sandboxReady = sandboxPair?.provisioningStatus === 'active'
  const mappingComplete = bundle.completion.complete
  const requiredComplete = Boolean(bundle.requiredData?.completedAt || bundle.requiredData?.ehrEndpoint)

  if (!sandboxReady || !mappingComplete || !requiredComplete) {
    await prisma.dashboardConnection.update({
      where: { id: liveConnectionId },
      data: { provisioningStatus: 'ready' }
    })
    return null
  }

  const existing = await prisma.provisioningJob.findUnique({
    where: { connectionId_environment: { connectionId: liveConnectionId, environment: 'live' } }
  })
  if (existing?.status === 'completed') return existing

  return enqueueProvisioningJob(orgId, liveConnectionId, 'live_activation', 'live')
}

export async function processQueuedJobs(limit = 5) {
  const jobs = await prisma.provisioningJob.findMany({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
    take: limit
  })

  for (const job of jobs) {
    await processProvisioningJob(job.id)
  }
}
