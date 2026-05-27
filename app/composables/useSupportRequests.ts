import { createSharedComposable } from '@vueuse/core'
import { supportRequests, supportTickets } from '~/data/compliance'
import type {
  SupportInboxItem,
  SupportInboxKind,
  SupportRequest,
  SupportRequestForm,
  SupportRequestStatus,
  SupportTicket,
  SupportTicketForm,
  WhileEnvironment
} from '~/types/while'

const categoryLabels = {
  general: 'General',
  billing: 'Billing',
  connection: 'Connection'
} as const

function toConnectionInboxItem(request: SupportRequest): SupportInboxItem {
  return {
    key: `connection:${request.id}`,
    id: request.id,
    kind: 'connection',
    title: request.partnerName,
    preview: `New connection · ${request.ehrVendor} · Go-live ${request.targetGoLive}`,
    status: request.status,
    environment: request.environment,
    submittedAt: request.submittedAt,
    ehrVendor: request.ehrVendor,
    targetGoLive: request.targetGoLive
  }
}

function toTicketInboxItem(ticket: SupportTicket): SupportInboxItem {
  const category = categoryLabels[ticket.category]
  const title = ticket.partnerName ?? category

  return {
    key: `ticket:${ticket.id}`,
    id: ticket.id,
    kind: 'ticket',
    title,
    preview: ticket.message,
    status: ticket.status,
    submittedAt: ticket.submittedAt,
    category: ticket.category,
    message: ticket.message,
    connectionId: ticket.connectionId
  }
}

const _useSupportRequests = () => {
  const requests = ref<SupportRequest[]>([...supportRequests])
  const tickets = ref<SupportTicket[]>([...supportTickets])
  const toast = useToast()
  const { addPendingConnection, getConnection } = useConnections()

  const inboxItems = computed<SupportInboxItem[]>(() => {
    const items = [
      ...requests.value.map(toConnectionInboxItem),
      ...tickets.value.map(toTicketInboxItem)
    ]
    return items.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
  })

  function getInboxItem(key: string): SupportInboxItem | undefined {
    return inboxItems.value.find(item => item.key === key)
  }

  function filterInbox(options: {
    search?: string
    status?: SupportRequestStatus
    kind?: SupportInboxKind
    environment?: WhileEnvironment
  }) {
    const q = options.search?.trim().toLowerCase()

    return inboxItems.value.filter((item) => {
      if (options.status && item.status !== options.status) return false
      if (options.kind && item.kind !== options.kind) return false
      if (options.environment && item.environment !== options.environment) return false
      if (q) {
        return item.title.toLowerCase().includes(q)
          || item.preview.toLowerCase().includes(q)
          || item.id.toLowerCase().includes(q)
          || item.ehrVendor?.toLowerCase().includes(q)
      }
      return true
    })
  }

  function submitRequest(form: SupportRequestForm): string {
    const id = `req-${Date.now().toString(36)}`
    const newRequest: SupportRequest = {
      id,
      partnerName: form.partnerName,
      ehrVendor: form.ehrVendor,
      environment: form.environment,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      targetGoLive: form.targetGoLive
    }

    requests.value = [newRequest, ...requests.value]

    addPendingConnection({
      id: `conn-pending-${id}`,
      partnerName: form.partnerName,
      ehrVendor: form.ehrVendor,
      environment: form.environment,
      pairedConnectionId: `conn-pending-pair-${id}`,
      sidecarId: `sidecar-pending-${id.slice(-4)}`,
      tunnelStatus: 'pending',
      wireguardPublicKey: 'Pending provisioning...',
      ehrEndpoint: 'Pending configuration',
      lastSyncAt: new Date().toISOString(),
      flightCheck: { mtu: false, handshake: false, hl7Ack: false },
      region: 'us-east-1',
      messagesProcessed24h: 0
    })

    toast.add({
      title: 'Support request submitted',
      description: `Request ${id.toUpperCase()} — our team will reach out within 1 business day.`,
      color: 'success',
      icon: 'i-iconoir-check-circle'
    })

    return `connection:${id}`
  }

  function submitTicket(form: SupportTicketForm): string {
    const id = `tkt-${Date.now().toString(36)}`
    const connection = form.connectionId ? getConnection(form.connectionId) : undefined

    const ticket: SupportTicket = {
      id,
      category: form.category,
      connectionId: form.connectionId,
      partnerName: connection?.partnerName,
      message: form.message,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    }

    tickets.value = [ticket, ...tickets.value]

    toast.add({
      title: 'Support ticket submitted',
      description: `${categoryLabels[form.category]} ticket ${id.toUpperCase()} — our team will respond within 1 business day.`,
      color: 'success',
      icon: 'i-iconoir-check-circle'
    })

    return `ticket:${id}`
  }

  return {
    requests,
    tickets,
    inboxItems,
    getInboxItem,
    filterInbox,
    submitRequest,
    submitTicket
  }
}

export const useSupportRequests = createSharedComposable(_useSupportRequests)
