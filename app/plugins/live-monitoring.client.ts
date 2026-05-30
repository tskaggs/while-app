import { authClient } from '~/lib/auth-client'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  if (config.public.mockMode) return

  const { data: session } = await authClient.useSession(useFetch)

  watch(
    () => session.value,
    (value) => {
      if (!value) return
      useLiveMonitoring().startPolling()
    },
    { immediate: true }
  )
})
