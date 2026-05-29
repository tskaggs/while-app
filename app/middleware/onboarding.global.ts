import { authClient } from '~/lib/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.mockMode) return

  const skipPaths = ['/login', '/signup', '/onboarding']
  if (skipPaths.includes(to.path) || to.path.startsWith('/accept-invitation') || to.path.startsWith('/docs')) {
    return
  }

  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) return

  try {
    const status = await $fetch<{ onboardingComplete: boolean }>('/api/org/status')
    if (!status.onboardingComplete) {
      return navigateTo('/onboarding')
    }
  } catch {
    return navigateTo('/onboarding')
  }
})
