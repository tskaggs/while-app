import type { ApiKeyHistoryEvent } from './apiKeyHistory'

export interface ConnectionCredentialsActiveKey {
  id: string
  keyPrefix: string
  environment: string
  createdAt: string
}

export interface ConnectionCredentialsResponse {
  connectionId: string
  partnerName: string
  isSystemSandbox: boolean
  canRotate: boolean
  activeKey: ConnectionCredentialsActiveKey | null
  webhookUrl: string | null
  webhookSecretConfigured: boolean
  hasPendingCredentials: boolean
  history: ApiKeyHistoryEvent[]
}

export const credentialsConnectionSelect = {
  id: true,
  name: true,
  environment: true,
  connectionType: true,
  sidecarId: true,
  pendingSandboxKey: true,
  pendingWebhookSecret: true
} as const

export const credentialsApiKeySelect = {
  id: true,
  keyPrefix: true,
  environment: true,
  isActive: true,
  createdAt: true,
  revokedAt: true
} as const

export type CredentialsConnectionRow = {
  id: string
  name: string
  environment: string
  connectionType: string
  sidecarId: string | null
  pendingSandboxKey: string | null
  pendingWebhookSecret: string | null
}

export function isSystemSandboxRow(connection: Pick<CredentialsConnectionRow, 'connectionType' | 'sidecarId'>) {
  return connection.connectionType === 'system_sandbox'
    || connection.sidecarId === 'while-sandbox'
}

export function buildCredentialsResponse(input: {
  connection: CredentialsConnectionRow
  activeKey: {
    id: string
    keyPrefix: string
    environment: string
    createdAt: Date
  } | null
  webhookUrl: string | null
  webhookSecret: string | null | undefined
  history: ApiKeyHistoryEvent[]
}): ConnectionCredentialsResponse {
  return {
    connectionId: input.connection.id,
    partnerName: input.connection.name,
    isSystemSandbox: isSystemSandboxRow(input.connection),
    canRotate: input.connection.environment === 'sandbox',
    activeKey: input.activeKey
      ? {
          id: input.activeKey.id,
          keyPrefix: input.activeKey.keyPrefix,
          environment: input.activeKey.environment,
          createdAt: input.activeKey.createdAt.toISOString()
        }
      : null,
    webhookUrl: input.webhookUrl,
    webhookSecretConfigured: Boolean(input.webhookSecret),
    hasPendingCredentials: Boolean(
      input.connection.pendingSandboxKey || input.connection.pendingWebhookSecret
    ),
    history: input.history
  }
}
