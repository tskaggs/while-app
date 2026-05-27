<script setup lang="ts">
const { data: navigation } = await useAsyncData('docs-nav', () =>
  queryCollectionNavigation('docs')
)
</script>

<template>
  <UDashboardGroup unit="rem">
    <div class="relative shrink-0">
      <UDashboardSidebar id="docs" collapsible resizable class="while-sidebar bg-elevated/25">
      <template #header="{ collapsed }">
        <WhileSidebarBrand :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UContentNavigation
          v-if="navigation"
          :navigation="navigation"
          :collapsed="collapsed"
          highlight
        />
      </template>

      <template #footer="{ collapsed }">
        <UButton
          to="/"
          :label="collapsed ? undefined : 'Back to Dashboard'"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :square="collapsed"
          block
        />
      </template>
      </UDashboardSidebar>

      <WhileSidebarCollapse />
    </div>

    <slot />
  </UDashboardGroup>
</template>
