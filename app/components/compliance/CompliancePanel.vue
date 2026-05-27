<script setup lang="ts">
const { compliance } = useCompliance()
const toast = useToast()

const baaConfig = computed(() => {
  const status = compliance.value.baaStatus
  return {
    signed: { color: 'success' as const, label: 'Signed', icon: 'i-lucide-check-circle' },
    pending: { color: 'warning' as const, label: 'Pending Signature', icon: 'i-lucide-clock' },
    expired: { color: 'error' as const, label: 'Expired', icon: 'i-lucide-alert-triangle' }
  }[status]
})

function downloadBaa() {
  toast.add({
    title: 'BAA download started',
    description: 'Business Associate Agreement PDF is being generated.',
    icon: 'i-lucide-download'
  })
}

function generateAuditReport() {
  toast.add({
    title: 'Audit report generated',
    description: 'Site Security Target report downloaded as PDF.',
    icon: 'i-lucide-file-check'
  })
}

function formatDate(date?: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-signature" class="size-5 text-primary" />
            <h3 class="font-semibold text-highlighted">Business Associate Agreement</h3>
          </div>
          <UBadge :color="baaConfig.color" variant="subtle" class="gap-1">
            <UIcon :name="baaConfig.icon" class="size-3" />
            {{ baaConfig.label }}
          </UBadge>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted uppercase">Signed</p>
          <p class="text-sm text-highlighted">{{ formatDate(compliance.baaSignedAt) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Expires</p>
          <p class="text-sm text-highlighted">{{ formatDate(compliance.baaExpiresAt) }}</p>
        </div>
        <div class="flex items-end">
          <UButton label="Download BAA" icon="i-lucide-download" color="neutral" variant="outline" @click="downloadBaa" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
            <h3 class="font-semibold text-highlighted">Compliance Checklist</h3>
          </div>
          <UButton label="Generate Audit Report" icon="i-lucide-file-check" size="sm" @click="generateAuditReport" />
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="item in compliance.checklist"
          :key="item.id"
          class="flex items-start gap-3 rounded-lg border border-default p-3"
        >
          <UIcon
            :name="item.status === 'pass' ? 'i-lucide-check-circle' : item.status === 'pending' ? 'i-lucide-clock' : 'i-lucide-x-circle'"
            class="size-5 shrink-0 mt-0.5"
            :class="item.status === 'pass' ? 'text-success' : item.status === 'pending' ? 'text-warning' : 'text-error'"
          />
          <div>
            <p class="text-sm font-medium text-highlighted">{{ item.label }}</p>
            <p class="text-xs text-muted">{{ item.description }}</p>
          </div>
          <UBadge
            :color="item.status === 'pass' ? 'success' : item.status === 'pending' ? 'warning' : 'error'"
            variant="subtle"
            class="ml-auto capitalize shrink-0"
          >
            {{ item.status }}
          </UBadge>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-scroll-text" class="size-5 text-primary" />
          <h3 class="font-semibold text-highlighted">Audit Log</h3>
        </div>
        <p class="text-sm text-muted mt-1">Control plane access only — no PHI recorded.</p>
      </template>

      <UTable
        :data="compliance.auditLog"
        :columns="[
          { accessorKey: 'timestamp', header: 'Time' },
          { accessorKey: 'actor', header: 'Actor' },
          { accessorKey: 'action', header: 'Action' },
          { accessorKey: 'resource', header: 'Resource' },
          { accessorKey: 'ipAddress', header: 'IP' }
        ]"
      >
        <template #timestamp-cell="{ row }">
          <span class="text-sm text-muted">{{ new Date(row.original.timestamp).toLocaleString() }}</span>
        </template>
        <template #resource-cell="{ row }">
          <code class="text-xs">{{ row.original.resource }}</code>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
