<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Overview',
  icon: 'i-lucide-layout-dashboard',
  to: '/',
  onSelect: () => { open.value = false }
}, {
  label: 'Connections',
  icon: 'i-lucide-network',
  to: '/connections',
  onSelect: () => { open.value = false }
}, {
  label: 'Messages',
  icon: 'i-lucide-activity',
  to: '/messages',
  onSelect: () => { open.value = false }
}, {
  label: 'Tunnel Uptime',
  icon: 'i-lucide-shield-check',
  to: '/uptime',
  onSelect: () => { open.value = false }
}, {
  label: 'Logs',
  icon: 'i-lucide-terminal',
  to: '/logs',
  onSelect: () => { open.value = false }
}, {
  label: 'Compliance',
  icon: 'i-lucide-shield-check',
  to: '/compliance',
  onSelect: () => { open.value = false }
}, {
  label: 'Developer Docs',
  icon: 'i-lucide-book-open',
  to: '/docs',
  onSelect: () => { open.value = false }
}, {
  label: 'Request Support',
  icon: 'i-lucide-headphones',
  to: '/support/request',
  badge: 'New',
  onSelect: () => { open.value = false }
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: '/settings',
  onSelect: () => { open.value = false }
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <div class="relative shrink-0">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        collapsible
        resizable
        class="while-sidebar bg-elevated/25"
        :ui="{ footer: 'lg:border-t lg:border-default' }"
      >
        <template #header="{ collapsed }">
          <WhileSidebarBrand :collapsed="collapsed" />
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[0]"
            orientation="vertical"
            tooltip
            popover
            class="while-sidebar-nav"
          />
        </template>

        <template #footer="{ collapsed }">
          <UserMenu :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>

      <WhileSidebarCollapse />
    </div>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
