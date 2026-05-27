export function useBackNavigation() {
  const router = useRouter()
  const previousRoute = useState<string | null>('navigation:previous-route', () => null)

  const canGoBack = computed(() => previousRoute.value !== null)

  function goBack() {
    if (previousRoute.value) {
      router.push(previousRoute.value)
    }
  }

  return { previousRoute, canGoBack, goBack }
}
