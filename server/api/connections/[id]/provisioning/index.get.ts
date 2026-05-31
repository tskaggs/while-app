import { requireMachineOrgOrPat } from '../../../../utils/machineAuth'
import { prisma } from '../../../../lib/prisma'
import {
  deriveFlightCheckFromMapping,
  deriveFlightCheckFromProvisioning,
  getConnectionMappingBundle
} from '../../../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['connections:read'])
  const connectionId = getRouterParam(event, 'id')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id required' })
  }

  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId: machineOrgId }
  })
  if (!connection) {
    throw createError({ statusCode: 404, message: 'Connection not found' })
  }

  const jobs = await prisma.provisioningJob.findMany({
    where: { connectionId },
    orderBy: { createdAt: 'asc' }
  })

  const bundle = await getConnectionMappingBundle(machineOrgId, connectionId)
  const activeJob = jobs.find(j => j.status === 'running' || j.status === 'queued')
    ?? jobs[jobs.length - 1]
  const requiredComplete = Boolean(
    bundle.requiredData?.completedAt || bundle.requiredData?.ehrEndpoint
  )
  const flightCheck = connection.provisioningStatus === 'provisioning' && activeJob
    ? deriveFlightCheckFromProvisioning(
        activeJob.stage,
        connection.tunnelStatus,
        bundle.completion,
        requiredComplete,
        connection.connectionType
      )
    : deriveFlightCheckFromMapping(
        connection.tunnelStatus,
        bundle.completion,
        requiredComplete,
        connection.connectionType
      )

  let pairedConnection = null
  if (connection.pairedConnectionId) {
    pairedConnection = await prisma.dashboardConnection.findUnique({
      where: { id: connection.pairedConnectionId }
    })
  }

  return {
    connection: {
      id: connection.id,
      name: connection.name,
      environment: connection.environment,
      provisioningStatus: connection.provisioningStatus,
      tunnelStatus: connection.tunnelStatus,
      sidecarId: connection.sidecarId,
      pairedConnectionId: connection.pairedConnectionId
    },
    pairedConnection: pairedConnection
      ? {
          id: pairedConnection.id,
          environment: pairedConnection.environment,
          provisioningStatus: pairedConnection.provisioningStatus,
          tunnelStatus: pairedConnection.tunnelStatus
        }
      : null,
    jobs: jobs.map((j: typeof jobs[number]) => ({
      id: j.id,
      environment: j.environment,
      jobType: j.jobType,
      status: j.status,
      stage: j.stage,
      progressPercent: j.progressPercent,
      vmId: j.vmId,
      errorMessage: j.errorMessage,
      startedAt: j.startedAt,
      completedAt: j.completedAt
    })),
    flightCheck,
    mappingCompletion: bundle.completion
  }
})
