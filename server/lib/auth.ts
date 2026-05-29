import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { prisma } from './prisma'
import { storeInviteLink } from '../utils/inviteLinks'

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-me-in-production-32chars',
  baseURL: getBaseUrl(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  experimental: {
    joins: true
  },
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'owner',
      async sendInvitationEmail(data) {
        const inviteLink = `${getBaseUrl()}/accept-invitation/${data.id}`
        console.log(`[While] Team invite for ${data.email} (${data.role}): ${inviteLink}`)
        storeInviteLink(data.id, data.email, data.role, inviteLink)
      }
    })
  ]
})

export type Auth = typeof auth
