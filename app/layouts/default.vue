<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [{
  label: 'Overview',
  icon: 'i-lucide-layout-dashboard',
  to: '/'
}, {
  label: 'Connections',
  icon: 'i-lucide-network',
  to: '/connections'
}, {
  label: 'Messages',
  icon: 'i-lucide-activity',
  to: '/messages'
}, {
  label: 'Tunnel Uptime',
  icon: 'i-lucide-shield-check',
  to: '/uptime'
}, {
  label: 'Logs',
  icon: 'i-lucide-terminal',
  to: '/logs'
}, {
  label: 'Compliance',
  icon: 'i-lucide-shield-check',
  to: '/compliance'
}, {
  label: 'Developer Docs',
  icon: 'i-lucide-book-open',
  to: '/docs'
}, {
  label: 'Support',
  icon: 'i-lucide-headphones',
  to: '/support'
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
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
