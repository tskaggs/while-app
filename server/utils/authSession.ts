import type { H3Event } from 'h3'
import { auth } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { resolveMachineOrgId } from './resolveMachineOrg'

export async function requireSession(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return session
}

async function ensureActiveOrganization(
  session: Awaited<ReturnType<typeof requireSession>>
) {
  if (session.session.activeOrganizationId) {
    return session.session.activeOrganizationId
  }

  const membership = await prisma.member.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    select: { organizationId: true }
  })

  if (!membership) {
    throw createError({
      statusCode: 400,
      message: 'No organization found. Create one from signup.'
    })
  }

  await prisma.session.update({
    where: { id: session.session.id },
    data: { activeOrganizationId: membership.organizationId }
  })

  return membership.organizationId
}

export async function requireActiveOrg(event: H3Event) {
  const session = await requireSession(event)
  const orgId = await ensureActiveOrganization(session)

  return { session, orgId, user: session.user }
}

export async function requireMachineOrg(event: H3Event) {
  const { session, orgId: authOrgId, user } = await requireActiveOrg(event)
  const machineOrgId = await resolveMachineOrgId(authOrgId)
  return { session, authOrgId, machineOrgId, user }
}
