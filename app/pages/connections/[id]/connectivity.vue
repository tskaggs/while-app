<script setup lang="ts">
const { connection, useConnectionPageMeta } = useConnectionDetail()

useConnectionPageMeta('Connectivity')
</script>

<template>
  <ConnectionsConnectivityHub v-if="connection" :connection="connection" />
</template>
