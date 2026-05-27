<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  items: NavigationMenuItem[]
}>()
</script>

<template>
  <UNavigationMenu
    :items="items"
    orientation="horizontal"
    class="connection-detail-nav"
    :ui="{
      list: 'gap-0.5',
      link: 'px-3 py-1.5 text-sm font-medium',
      linkLeadingIcon: 'hidden'
    }"
  />
</template>

<style scoped>
.connection-detail-nav :deep(a.router-link-active) {
  color: var(--ui-text-highlighted);
  background-color: var(--ui-bg-accented);
  border-radius: 0.5rem;
}
</style>
