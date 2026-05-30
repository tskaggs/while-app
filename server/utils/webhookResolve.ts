import { generateWebhookSecret } from './provisionOrg'

export interface WebhookOverrideFields {
  webhookUrl?: string | null
  webhookSecret?: string | null
}

export function resolveEffectiveWebhookUrl(
  orgUrl: string | null | undefined,
  connectionUrl: string | null | undefined
): string | null {
  const override = connectionUrl?.trim()
  if (override) return override
  const orgDefault = orgUrl?.trim()
  return orgDefault || null
}

export function resolveEffectiveWebhookSecret(
  orgSecret: string | null | undefined,
  connectionSecret: string | null | undefined
): string | null {
  const override = connectionSecret?.trim()
  if (override) return override
  const orgDefault = orgSecret?.trim()
  return orgDefault || null
}

export function connectionInheritsOrgDefault(connection: WebhookOverrideFields): boolean {
  return !connection.webhookUrl?.trim() && !connection.webhookSecret?.trim()
}

export function maskWebhookSecret(secret: string | null | undefined): string | null {
  if (!secret) return null
  if (secret.length <= 12) return 'whsec_••••'
  return `${secret.slice(0, 12)}••••`
}

export function rotateConnectionWebhookSecret(): string {
  return generateWebhookSecret()
}

export interface ResolvedWebhookDestination {
  webhookUrl: string | null
  webhookSecret: string | null
  inheritsDefault: boolean
  urlSource: 'connection' | 'org' | null
  secretSource: 'connection' | 'org' | null
}

export function resolveWebhookDestination(
  org: WebhookOverrideFields,
  connection: WebhookOverrideFields
): ResolvedWebhookDestination {
  const hasConnectionUrl = Boolean(connection.webhookUrl?.trim())
  const hasConnectionSecret = Boolean(connection.webhookSecret?.trim())
  const webhookUrl = resolveEffectiveWebhookUrl(org.webhookUrl, connection.webhookUrl)
  const webhookSecret = resolveEffectiveWebhookSecret(org.webhookSecret, connection.webhookSecret)

  return {
    webhookUrl,
    webhookSecret,
    inheritsDefault: connectionInheritsOrgDefault(connection),
    urlSource: hasConnectionUrl ? 'connection' : webhookUrl ? 'org' : null,
    secretSource: hasConnectionSecret ? 'connection' : webhookSecret ? 'org' : null
  }
}
