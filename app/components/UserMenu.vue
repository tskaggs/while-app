<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

const user = ref({
  name: 'Sarah Chen'
})

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
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
}], [{
  label: 'Settings',
  icon: 'i-iconoir-settings',
  to: '/settings'
}], [{
  label: 'Log out',
  icon: 'i-iconoir-log-out'
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-48' }"
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
