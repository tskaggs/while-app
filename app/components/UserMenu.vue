<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { authClient, signOut } from '~/lib/auth-client'

defineProps<{
  collapsed?: boolean
}>()

const config = useRuntimeConfig()
const colorMode = useColorMode()
const { data: session } = await authClient.useSession(useFetch)

const userName = computed(() => session.value?.user.name ?? 'Account')
const userEmail = computed(() => session.value?.user.email ?? '')

async function logout() {
  await signOut()
  await navigateTo('/login')
}

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: userName.value,
  description: userEmail.value || undefined,
  icon: 'i-iconoir-user-circle'
}], [{
  label: 'Light',
  icon: 'i-iconoir-sun-light',
  type: 'checkbox',
  checked: colorMode.preference === 'light',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'light'
  }
}, {
  label: 'Dark',
  icon: 'i-iconoir-half-moon',
  type: 'checkbox',
  checked: colorMode.preference === 'dark',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'dark'
  }
}, {
  label: 'System',
  icon: 'i-iconoir-computer',
  type: 'checkbox',
  checked: colorMode.preference === 'system',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'system'
  }
}], ...(config.public.mockMode ? [] : [[{
  label: 'Settings',
  icon: 'i-iconoir-settings',
  to: '/settings'
}]]), [{
  label: 'Log out',
  icon: 'i-iconoir-log-out',
  onSelect() {
    if (!config.public.mockMode) logout()
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-56' }"
  >
    <UButton
      icon="i-iconoir-profile-circle"
      color="neutral"
      variant="ghost"
      :square="true"
      class="data-[state=open]:bg-elevated rounded-full"
      aria-label="User menu"
    />
  </UDropdownMenu>
</template>
