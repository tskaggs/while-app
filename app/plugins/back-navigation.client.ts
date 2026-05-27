export default defineNuxtPlugin(() => {
  const router = useRouter()
  const previousRoute = useState<string | null>('navigation:previous-route', () => null)

  router.beforeEach((to, from) => {
    if (from.matched.length > 0 && from.fullPath !== to.fullPath) {
      previousRoute.value = from.fullPath
    }
  })
})
