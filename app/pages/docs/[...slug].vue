<script setup lang="ts">
definePageMeta({ layout: 'docs' })

const route = useRoute()

const { data: page } = await useAsyncData(`docs-${route.path}`, () =>
  queryCollection('docs').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useSeoMeta({ title: page.value.title })
</script>

<template>
  <div class="flex gap-8">
    <article class="min-w-0 flex-1">
      <PageHeader :title="page!.title" :description="page!.description" />
      <div class="prose prose-invert max-w-none">
        <ContentRenderer v-if="page" :value="page" />
      </div>
    </article>

    <aside
      v-if="page?.body?.toc?.links?.length"
      class="hidden w-56 shrink-0 xl:block"
    >
      <div class="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto pb-6 xl:top-20 xl:max-h-[calc(100svh-6rem)]">
        <UContentToc :links="page.body.toc.links" />
      </div>
    </aside>
  </div>
</template>
