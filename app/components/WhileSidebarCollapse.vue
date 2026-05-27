<script setup lang="ts">
import { useDashboard } from '#ui/utils/dashboard'

const dashboard = useDashboard()

const collapsed = computed(() => dashboard.sidebarCollapsed?.value ?? false)

function toggle() {
  dashboard.collapseSidebar?.(!collapsed.value)
}
</script>

<template>
  <button
    type="button"
    class="while-sidebar-collapse"
    :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    @click="toggle"
  >
    <UIcon
      :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
      class="while-sidebar-collapse-icon size-3.5"
    />
  </button>
</template>
