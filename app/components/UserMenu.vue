<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

const user = ref({
  name: 'Sarah Chen',
  avatar: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    alt: 'Sarah Chen'
  }
})

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: 'Light',
  icon: 'i-lucide-sun',
  type: 'checkbox',
  checked: colorMode.preference === 'light',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'light'
  }
}, {
  label: 'Dark',
  icon: 'i-lucide-moon',
  type: 'checkbox',
  checked: colorMode.preference === 'dark',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'dark'
  }
}, {
  label: 'System',
  icon: 'i-lucide-monitor',
  type: 'checkbox',
  checked: colorMode.preference === 'system',
  onSelect(e: Event) {
    e.preventDefault()
    colorMode.preference = 'system'
  }
}], [{
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out'
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-48' }"
  >
    <UButton
      :avatar="user.avatar"
      :label="collapsed ? undefined : undefined"
      color="neutral"
      variant="ghost"
      :square="true"
      class="data-[state=open]:bg-elevated rounded-full"
    />
  </UDropdownMenu>
</template>
