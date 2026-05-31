<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [{
  label: 'Connections',
  icon: 'i-iconoir-network',
  to: '/'
}, {
  label: 'Messages',
  icon: 'i-iconoir-activity',
  to: '/messages'
}, {
  label: 'Tunnel Uptime',
  icon: 'i-iconoir-shield-check',
  to: '/uptime'
}, {
  label: 'Logs',
  icon: 'i-iconoir-terminal',
  to: '/logs'
}, {
  label: 'Compliance',
  icon: 'i-iconoir-shield-check',
  to: '/compliance'
}, {
  label: 'Developer Docs',
  icon: 'i-iconoir-open-book',
  to: '/docs'
}, {
  label: 'Support',
  icon: 'i-iconoir-headset',
  to: '/support'
}, {
  label: 'Settings',
  icon: 'i-iconoir-settings',
  to: '/settings'
}]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.map(({ label, icon, to }) => ({ label, icon, to }))
}])
</script>

<template>
  <WhileAppShell>
    <UDashboardSearch :groups="groups" />
    <slot />
  </WhileAppShell>
</template>
