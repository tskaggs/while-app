export type VmEnvironment = 'sandbox' | 'live'

export type ProvisioningStage =
  | 'queued'
  | 'vm_create'
  | 'wireguard'
  | 'sidecar_boot'
  | 'health_check'
  | 'completed'
  | 'failed'

export interface OrchestratorVmResponse {
  vm_id: string
  org_id: string
  connection_id: string
  environment: string
  status: string
  stage: ProvisioningStage
  progress_percent: number
  firecracker_pid: number | null
  wireguard_public_key?: string | null
  wireguard_private_key_ref?: string | null
  wireguard_endpoint?: string | null
  wireguard_listen_port?: number | null
}

function orchestratorBaseUrl() {
  const config = useRuntimeConfig()
  return config.orchestratorUrl
    || process.env.ORCHESTRATOR_URL
    || 'http://localhost:8090'
}

function orchestratorHeaders(): Record<string, string> {
  const config = useRuntimeConfig()
  const secret = config.orchestratorSecret || process.env.ORCHESTRATOR_SECRET
  return secret ? { 'X-Orchestrator-Secret': secret } : {}
}

export async function createOrchestratorVm(input: {
  orgId: string
  connectionId: string
  environment: VmEnvironment
  vmId: string
}) {
  return $fetch<OrchestratorVmResponse>(`${orchestratorBaseUrl()}/v1/vms`, {
    method: 'POST',
    headers: orchestratorHeaders(),
    body: {
      org_id: input.orgId,
      connection_id: input.connectionId,
      environment: input.environment,
      vm_id: input.vmId
    }
  })
}

export async function getOrchestratorVm(vmId: string) {
  return $fetch<OrchestratorVmResponse>(`${orchestratorBaseUrl()}/v1/vms/${encodeURIComponent(vmId)}`, {
    headers: orchestratorHeaders()
  })
}

export async function healthCheckOrchestratorVm(vmId: string) {
  return $fetch<{ healthy: boolean, stage: ProvisioningStage, progress_percent: number }>(
    `${orchestratorBaseUrl()}/v1/vms/${encodeURIComponent(vmId)}/health`,
    {
      method: 'POST',
      headers: orchestratorHeaders()
    }
  )
}

export async function deleteOrchestratorVm(vmId: string) {
  return $fetch<{ deleted: string }>(`${orchestratorBaseUrl()}/v1/vms/${encodeURIComponent(vmId)}`, {
    method: 'DELETE',
    headers: orchestratorHeaders()
  })
}
