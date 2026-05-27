<script setup lang="ts">
const { connection, useConnectionPageMeta } = useConnectionDetail()

useConnectionPageMeta('Logs')
</script>

<template>
  <div v-if="connection" class="space-y-4">
    <p class="text-sm text-muted">
      Search and filter logs for this connection
    </p>
    <LogsLogStream :connection-id="connection.id" />
  </div>
</template>
