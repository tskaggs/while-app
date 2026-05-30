import { authClient } from '~/lib/auth-client'
import { fetchOrgStatus, getFetchErrorStatus } from '~/composables/useOrgStatus'

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.mockMode) return

  const publicPaths = ['/login', '/signup']
  if (
    publicPaths.includes(to.path)
    || to.path.startsWith('/accept-invitation')
    || to.path.startsWith('/docs')
  ) {
    return
  }

  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) return

  let status: Awaited<ReturnType<typeof fetchOrgStatus>>
  try {
    status = await fetchOrgStatus()
  } catch (error) {
    const code = getFetchErrorStatus(error)
    if (code === 401) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
    if (code === 400 || code === 404) {
      if (to.path !== '/onboarding') {
        return navigateTo({ path: '/onboarding', query: { redirect: to.fullPath } })
      }
      return
    }
    return
  }

  if (status.onboardingComplete) {
    if (to.path === '/onboarding') {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      return navigateTo(redirect)
    }
    return
  }

  if (to.path !== '/onboarding') {
    return navigateTo({ path: '/onboarding', query: { redirect: to.fullPath } })
  }
})
