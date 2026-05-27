<script setup lang="ts">
const { connection, useConnectionPageMeta } = useConnectionDetail()

useConnectionPageMeta('Mapping')
</script>

<template>
  <ConnectionsMappingPanel v-if="connection" :connection="connection" />
</template>
