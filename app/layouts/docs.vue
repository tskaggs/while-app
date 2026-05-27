<script setup lang="ts">
const open = ref(false)

const { data: navigation } = await useAsyncData('docs-nav', () =>
  queryCollectionNavigation('docs')
)
</script>

<template>
  <div class="flex min-h-svh flex-col bg-default">
    <WhileTopNav />

    <UDashboardGroup unit="rem" class="flex min-h-0 flex-1">
      <UDashboardSidebar
        id="docs"
        v-model:open="open"
        collapsible
        resizable
        class="border-e border-default bg-elevated/25"
      >
        <template #header="{ collapsed }">
          <NuxtLink
            to="/docs"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-highlighted transition-colors hover:bg-accented/50"
            :class="collapsed ? 'justify-center' : ''"
          >
            <UIcon name="i-iconoir-open-book" class="size-4 shrink-0 text-primary" />
            <span v-if="!collapsed">Developer Docs</span>
          </NuxtLink>
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
            icon="i-iconoir-arrow-left"
            color="neutral"
            variant="ghost"
            :square="collapsed"
            block
          />
        </template>
      </UDashboardSidebar>

      <div class="min-w-0 flex-1 overflow-y-auto scroll-pt-28 lg:scroll-pt-24">
        <div class="px-4 pb-6 pt-10 lg:px-6 lg:pb-8 lg:pt-12">
          <slot />
        </div>
      </div>
    </UDashboardGroup>
  </div>
</template>
