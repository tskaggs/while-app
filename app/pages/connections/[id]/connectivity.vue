<script setup lang="ts">
const { connection, useConnectionPageMeta } = useConnectionDetail()

useConnectionPageMeta('Connectivity')
</script>

<template>
  <ConnectionsConnectivityPanel v-if="connection" :connection="connection" />
</template>
