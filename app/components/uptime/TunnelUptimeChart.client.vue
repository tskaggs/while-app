<script setup lang="ts">
import {
  VisAxis,
  VisCrosshair,
  VisLine,
  VisTooltip,
  VisXYContainer
} from '~/utils/unovis'
import { buildChartTooltipHtml, formatChartTooltipUtc } from '~/utils/chartTooltip'
import type { TunnelUptimeBucket, TunnelUptimeGranularity } from '~/types/while'

const props = defineProps<{
  buckets: TunnelUptimeBucket[]
  connections: Array<{ id: string, partnerName: string, color: string }>
  granularity: TunnelUptimeGranularity
  minuteMode?: boolean
  selectedHour?: number
  averageUptime: number
}>()

const subtitle = computed(() => {
  if (props.granularity === 'minute' && props.selectedHour !== undefined) {
    return `By minute for ${String(props.selectedHour).padStart(2, '0')}:00 UTC, per connection`
  }
  if (props.minuteMode) {
    return 'By hour for the selected day — select an hour to view by minute'
  }
  return 'By hour for the selected day, per connection'
})

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)

type ChartRow = TunnelUptimeBucket & { index: number }

const data = computed<ChartRow[]>(() =>
  props.buckets.map((bucket, index) => ({ ...bucket, index }))
)

const x = (d: ChartRow) => d.index
const y = computed(() =>
  props.connections.map(connection => (d: ChartRow) => d.uptime[connection.id] ?? 0)
)
const colors = computed(() => props.connections.map(connection => connection.color))

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const xTicks = (index: number) => {
  const bucket = data.value[index]
  if (!bucket) return ''
  if (props.granularity === 'minute' && index % 5 !== 0) return ''
  return bucket.label
}

const yTicks = (value: number) => `${value}%`

const template = (d: ChartRow) => {
  const items = props.connections.map(connection => ({
    label: connection.partnerName,
    value: formatPercent(d.uptime[connection.id] ?? 0),
    color: connection.color
  }))

  return buildChartTooltipHtml(formatChartTooltipUtc(d.bucketStart), items)
}
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Tunnel Uptime
          </p>
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatPercent(averageUptime) }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ subtitle }}
          </p>
        </div>
        <div class="flex flex-wrap justify-end gap-x-4 gap-y-2 max-w-md">
          <span
            v-for="connection in connections"
            :key="connection.id"
            class="flex items-center gap-1.5 text-xs text-muted"
          >
            <span
              class="size-2 rounded-full shrink-0 ring-1 ring-inset ring-default"
              :style="{ backgroundColor: connection.color }"
            />
            {{ connection.partnerName }}
          </span>
        </div>
      </div>
    </template>

    <div v-if="!data.length || !connections.length" class="flex flex-col items-center gap-2 py-16 text-muted">
      <UIcon name="i-iconoir-graph-up" class="size-8" />
      <p class="text-sm">No uptime data for the selected filters.</p>
    </div>

    <VisXYContainer
      v-else
      :data="data"
      :padding="{ top: 24, left: 8, right: 16 }"
      class="while-unovis-chart h-96"
      :width="width"
      :y-domain="[0, 100]"
    >
      <VisLine
        v-for="(accessor, index) in y"
        :key="connections[index]?.id ?? index"
        :x="x"
        :y="accessor"
        :color="colors[index]"
        :line-width="2"
      />
      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :grid-line="true"
        :tick-format="yTicks"
      />
      <VisCrosshair color="var(--color-while-500)" :template="template" />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>
