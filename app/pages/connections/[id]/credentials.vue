<script setup lang="ts">
const { connectionId } = useConnectionDetail()

await navigateTo(`/connections/${connectionId.value}/connectivity?section=credential`, { replace: true })
</script>
