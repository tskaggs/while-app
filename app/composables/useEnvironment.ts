import { createSharedComposable } from '@vueuse/core'
import type { WhileEnvironment } from '~/types/while'

const STORAGE_KEY = 'while-env'

const _useEnvironment = () => {
  const environment = useState<WhileEnvironment>('while-env', () => 'sandbox')
  const toast = useToast()

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as WhileEnvironment | null
    if (stored === 'sandbox' || stored === 'live') {
      environment.value = stored
    }
  })

  watch(environment, (value) => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, value)
    }
  })

  const isSandbox = computed(() => environment.value === 'sandbox')
  const isLive = computed(() => environment.value === 'live')

  const environmentLabel = computed(() =>
    environment.value === 'sandbox' ? 'Sandbox' : 'Live'
  )

  const environmentColor = computed(() =>
    environment.value === 'sandbox' ? 'warning' as const : 'success' as const
  )

  function setEnvironment(env: WhileEnvironment) {
    if (env === environment.value) return

    environment.value = env
    toast.add({
      title: `Switched to ${env === 'sandbox' ? 'Sandbox' : 'Live'}`,
      description: env === 'sandbox'
        ? 'Viewing sandbox — mock EHR endpoints, no PHI'
        : 'Viewing live environment — production integrations',
      color: env === 'sandbox' ? 'warning' : 'success',
      icon: env === 'sandbox' ? 'i-iconoir-flask' : 'i-iconoir-shield-check'
    })
  }

  return {
    environment,
    isSandbox,
    isLive,
    environmentLabel,
    environmentColor,
    setEnvironment
  }
}

export const useEnvironment = createSharedComposable(_useEnvironment)
