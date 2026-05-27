<script setup lang="ts">
definePageMeta({ layout: 'docs' })

const route = useRoute()

const { data: navigation } = await useAsyncData('docs-navigation', () =>
  queryCollectionNavigation('docs')
)

const { data: page } = await useAsyncData(`docs-${route.path}`, () =>
  queryCollection('docs').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useSeoMeta({ title: page.value.title })
</script>

<template>
  <UDashboardPanel id="docs">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle :title="page!.title" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex gap-8">
        <article class="flex-1 min-w-0 prose prose-invert max-w-none">
          <p v-if="page!.description" class="text-lg text-muted mb-6 not-prose">
            {{ page!.description }}
          </p>
          <ContentRenderer v-if="page" :value="page" />
        </article>
        <aside v-if="page?.body?.toc?.links?.length" class="hidden xl:block w-56 shrink-0">
          <UContentToc :links="page.body.toc.links" />
        </aside>
      </div>
    </template>
  </UDashboardPanel>
</template>
