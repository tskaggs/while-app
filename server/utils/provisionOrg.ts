import { createHash, randomBytes } from 'crypto'
import { prisma } from '../lib/prisma'
import { storePendingApiKey, getPendingApiKey } from './pendingApiKeys'

const KEY_PREFIX = 'wh_test_'
const WEBHOOK_PREFIX = 'whsec_'

export function orgShortId(orgId: string) {
  return orgId.replace(/-/g, '').slice(0, 8)
}

export function defaultConnectionId(orgId: string) {
  return `conn-sa-${orgShortId(orgId)}`
}

export function defaultPatientId(orgId: string, index = 1) {
  return `pat_${orgShortId(orgId)}_${String(index).padStart(2, '0')}`
}

function generateSecret(length = 32) {
  return randomBytes(length).toString('hex').slice(0, length)
}

export function hashApiKey(rawKey: string) {
  const secret = rawKey.startsWith(KEY_PREFIX)
    ? rawKey.slice(KEY_PREFIX.length)
    : rawKey.startsWith('wh_live_')
      ? rawKey.slice('wh_live_'.length)
      : rawKey
  return createHash('sha256').update(secret).digest('hex')
}

export function generateSandboxApiKey() {
  const secret = generateSecret(32)
  return {
    rawKey: `${KEY_PREFIX}${secret}`,
    hashedKey: createHash('sha256').update(secret).digest('hex')
  }
}

export function generateWebhookSecret() {
  return `${WEBHOOK_PREFIX}${generateSecret(32)}`
}

export interface ProvisionResult {
  orgId: string
  orgName: string
  sandboxApiKey: string
  webhookSecret: string
  connectionId: string
  samplePatientId: string
  alreadyProvisioned: boolean
  keyRegenerated?: boolean
}

async function rotateSandboxApiKey(orgId: string) {
  const { rawKey, hashedKey } = generateSandboxApiKey()

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.updateMany({
      where: { orgId, environment: 'sandbox', isActive: true },
      data: { isActive: false }
    })

    await tx.apiKey.create({
      data: {
        orgId,
        hashedKey,
        keyPrefix: KEY_PREFIX,
        environment: 'sandbox',
        isActive: true
      }
    })
  })

  storePendingApiKey(orgId, rawKey)
  return rawKey
}

/** Return pending sandbox key, or rotate a new one while onboarding is incomplete. */
export async function resolveOnboardingSandboxKey(orgId: string) {
  const pendingKey = getPendingApiKey(orgId)
  if (pendingKey) {
    return { sandboxApiKey: pendingKey, keyRegenerated: false }
  }

  const completed = await isOnboardingComplete(orgId)
  if (completed) {
    return { sandboxApiKey: '', keyRegenerated: false }
  }

  const sandboxApiKey = await rotateSandboxApiKey(orgId)
  return { sandboxApiKey, keyRegenerated: true }
}

export async function provisionOrganization(
  orgId: string,
  orgName: string,
  webhookBaseUrl: string
): Promise<ProvisionResult> {
  const existing = await prisma.machineOrganization.findUnique({
    where: { id: orgId },
    include: { sandboxSettings: true, orgOnboarding: true }
  })

  const connectionId = defaultConnectionId(orgId)
  const samplePatientId = defaultPatientId(orgId, 1)
  const webhookUrl = `${webhookBaseUrl.replace(/\/$/, '')}/api/webhooks/while`

  if (existing) {
    const { sandboxApiKey, keyRegenerated } = await resolveOnboardingSandboxKey(orgId)
    return {
      orgId,
      orgName: existing.name,
      sandboxApiKey,
      webhookSecret: existing.sandboxSettings?.webhookSecret ?? '',
      connectionId,
      samplePatientId,
      alreadyProvisioned: true,
      keyRegenerated
    }
  }

  const { rawKey, hashedKey } = generateSandboxApiKey()
  const webhookSecret = generateWebhookSecret()

  await prisma.$transaction(async (tx) => {
    await tx.machineOrganization.create({
      data: {
        id: orgId,
        name: orgName,
        metadata: { has_live: false, plan: 'startup' }
      }
    })

    await tx.apiKey.create({
      data: {
        orgId,
        hashedKey,
        keyPrefix: KEY_PREFIX,
        environment: 'sandbox',
        isActive: true
      }
    })

    await tx.sandboxSettings.create({
      data: {
        orgId,
        webhookUrl,
        webhookSecret,
        cronEnabled: true
      }
    })

    await tx.dashboardConnection.create({
      data: {
        id: connectionId,
        orgId,
        name: 'While Sandbox',
        connectionType: 'system_sandbox',
        environment: 'sandbox',
        isDeletable: false,
        isHidden: false
      }
    })

    await tx.orgOnboarding.create({
      data: { orgId }
    })
  })

  storePendingApiKey(orgId, rawKey)

  return {
    orgId,
    orgName,
    sandboxApiKey: rawKey,
    webhookSecret,
    connectionId,
    samplePatientId,
    alreadyProvisioned: false
  }
}

export async function getSandboxApiKey(orgId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { orgId, environment: 'sandbox', isActive: true }
  })
  if (!key) return null
  return key
}

export async function isOnboardingComplete(orgId: string) {
  const onboarding = await prisma.orgOnboarding.findUnique({ where: { orgId } })
  return Boolean(onboarding?.completedAt)
}

export async function completeOnboarding(orgId: string) {
  await prisma.orgOnboarding.upsert({
    where: { orgId },
    create: { orgId, completedAt: new Date(), apiKeyShownAt: new Date() },
    update: { completedAt: new Date() }
  })
}

export async function markApiKeyShown(orgId: string) {
  await prisma.orgOnboarding.upsert({
    where: { orgId },
    create: { orgId, apiKeyShownAt: new Date() },
    update: { apiKeyShownAt: new Date() }
  })
}
