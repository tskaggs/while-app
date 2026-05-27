import { complianceData, supportRequests } from '~/data/compliance'
import type { SupportRequest, SupportRequestForm, SupportTicket, SupportTicketForm } from '~/types/while'

export function useCompliance() {
  const compliance = ref(complianceData)

  return { compliance }
}

export function useSupportRequests() {
  const requests = ref([...supportRequests])
  const tickets = ref<SupportTicket[]>([])
  const toast = useToast()
  const { addPendingConnection, getConnection } = useConnections()

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
      description: `Ticket ${id.toUpperCase()} — our team will reach out within 1 business day.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    return id
  }

  function submitTicket(form: SupportTicketForm): string {
    const id = `tkt-${Date.now().toString(36)}`
    const connection = form.connectionId ? getConnection(form.connectionId) : undefined
    const categoryLabels = {
      general: 'General',
      billing: 'Billing',
      connection: 'Connection'
    } as const

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
      icon: 'i-lucide-check-circle'
    })

    return id
  }

  return { requests, tickets, submitRequest, submitTicket }
}
