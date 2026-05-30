import type { H3Event } from 'h3'
import { prisma } from '../lib/prisma'
import { defaultPatientId } from './provisionOrg'
import { resolveSandboxApiKey, normalizeSandboxApiKey } from './resolveSandboxApiKey'

const KEY_PREFIX = 'wh_test_'

export async function assertConnectionAccess(machineOrgId: string, connectionId: string) {
  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId: machineOrgId }
  })

  if (!connection) {
    throw createError({ statusCode: 404, message: 'Connection not found' })
  }

  return connection
}

export function isSystemSandboxConnection(connection: {
  connectionType: string
  sidecarId: string | null
}) {
  return connection.connectionType === 'system_sandbox'
    || connection.sidecarId === 'while-sandbox'
}

export function readSandboxApiKeyFromEvent(event: H3Event, overrideKey?: string | null) {
  if (overrideKey) {
    return overrideKey
  }

  const headers = getRequestHeaders(event)
  const headerKey = headers['x-sandbox-api-key']
  if (headerKey) return headerKey

  const authorization = headers.authorization
  const bearerKey = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearerKey) return bearerKey

  const query = getQuery(event)
  const queryKey = query.sandboxApiKey ?? query.apiKey
  if (typeof queryKey === 'string') return queryKey

  return null
}

export async function resolveTestApiKey(
  event: H3Event,
  machineOrgId: string,
  overrideKey?: string | null
) {
  const providedKey = readSandboxApiKeyFromEvent(event, overrideKey)
  const hasProvidedKey = Boolean(normalizeSandboxApiKey(providedKey))
  const apiKey = await resolveSandboxApiKey(machineOrgId, providedKey)

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: hasProvidedKey
        ? `Sandbox API key not recognized for this organization. Paste the full ${KEY_PREFIX}* key from onboarding and confirm it matches your org key prefix.`
        : 'Sandbox API key required. Paste your wh_test_* key in the Test view (session only).'
    })
  }

  return apiKey
}

export function samplePatientIdForOrg(machineOrgId: string) {
  return defaultPatientId(machineOrgId, 1)
}
