import { subscribeProvisioningEvents } from '../../utils/provisioningEvents'
import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const connectionId = String(query.connectionId ?? '')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'connectionId query param required' })
  }

  const { machineOrgId } = await requireMachineOrgOrPat(event, ['connections:read'])

  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId: machineOrgId }
  })
  if (!connection) {
    throw createError({ statusCode: 404, message: 'Connection not found' })
  }

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'connected', connectionId })

      const unsubscribe = subscribeProvisioningEvents(connectionId, (payload) => {
        send({ type: 'provisioning', ...payload })
      })

      const heartbeat = setInterval(() => {
        send({ type: 'heartbeat', at: new Date().toISOString() })
      }, 15000)

      event.node.req.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
        controller.close()
      })
    }
  })

  return stream
})
