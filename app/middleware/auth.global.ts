import { authClient } from '~/lib/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.mockMode) return

  const publicPaths = ['/login', '/signup']
  const publicPrefixes = ['/accept-invitation', '/docs']

  const isPublic = publicPaths.includes(to.path)
    || publicPrefixes.some(prefix => to.path.startsWith(prefix))

  if (isPublic) return

  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
