<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <WhileLogo :collapsed="collapsed" />
</template>
