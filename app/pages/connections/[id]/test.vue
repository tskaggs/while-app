<script setup lang="ts">
const { connectionId } = useConnectionDetail()

await navigateTo(`/connections/${connectionId.value}/connectivity?section=tests`, { replace: true })
</script>
