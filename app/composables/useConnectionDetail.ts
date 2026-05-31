import type { Connection } from '~/types/while'
import type { NavigationMenuItem } from '@nuxt/ui'

export const useConnectionDetail = () => {
  const route = useRoute()
  const router = useRouter()
  const { environment } = useEnvironment()
  const { getConnectionForCurrentEnvironment, isSystemSandbox } = useConnections()

  const connectionId = computed(() => route.params.id as string)

  const connection = computed(() =>
    getConnectionForCurrentEnvironment(connectionId.value)
  )

  const connectionBasePath = computed(() =>
    connection.value ? `/connections/${connection.value.id}` : ''
  )

  const navItems = computed<NavigationMenuItem[]>(() => {
    if (!connection.value) return []
    const base = `/connections/${connection.value.id}`
    return [
      { label: 'Overview', to: base },
      { label: 'Connectivity', to: `${base}/connectivity` },
      { label: 'Mapping', to: `${base}/mapping` },
      { label: 'Messages', to: `${base}/messages` },
      { label: 'Logs', to: `${base}/logs` }
    ]
  })

  /** Keep URL on the paired connection id when switching Sandbox ↔ Live */
  watch(
    [environment, connectionId],
    () => {
      const resolved = getConnectionForCurrentEnvironment(connectionId.value)
      if (!resolved || resolved.id === connectionId.value) return

      const suffix = route.path.replace(/^\/connections\/[^/]+/, '') || ''
      router.replace(`/connections/${resolved.id}${suffix}`)
    },
    { immediate: true }
  )

  function useConnectionPageMeta(titleSuffix?: string) {
    useSeoMeta({
      title: () => {
        const name = connection.value?.partnerName ?? 'Connection'
        return titleSuffix ? `${name} · ${titleSuffix}` : name
      }
    })
  }

  return {
    connectionId,
    connection,
    connectionBasePath,
    navItems,
    useConnectionPageMeta,
    isSystemSandbox
  }
}
