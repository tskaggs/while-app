<script setup lang="ts">
import {
  VisAxis,
  VisCrosshair,
  VisStackedBar,
  VisTooltip,
  VisXYContainer,
  stackedBarConfig
} from '~/utils/unovis'
import { buildChartTooltipHtml, formatChartTooltipUtc } from '~/utils/chartTooltip'
import type { MessageGranularity, MessageHistogramBucket } from '~/types/while'

const props = defineProps<{
  buckets: MessageHistogramBucket[]
  connections: Array<{ id: string, partnerName: string, color: string }>
  granularity: MessageGranularity
  minuteMode?: boolean
  selectedHour?: number
  total: number
}>()

const subtitle = computed(() => {
  if (props.granularity === 'minute' && props.selectedHour !== undefined) {
    return `By minute for ${String(props.selectedHour).padStart(2, '0')}:00 UTC, split by connection`
  }
  if (props.minuteMode) {
    return 'By hour for the selected day — select an hour to view by minute'
  }
  return 'By hour for the selected day, split by connection'
})

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)

type ChartRow = MessageHistogramBucket & { index: number }

const data = computed<ChartRow[]>(() =>
  props.buckets.map((bucket, index) => ({ ...bucket, index }))
)

const x = (d: ChartRow) => d.index
const y = computed(() =>
  props.connections.map(connection => (d: ChartRow) => d.counts[connection.id] ?? 0)
)
const colors = computed(() => props.connections.map(connection => connection.color))

const formatNumber = new Intl.NumberFormat('en').format

const xTicks = (index: number) => {
  const bucket = data.value[index]
  if (!bucket) return ''
  if (props.granularity === 'minute' && index % 5 !== 0) return ''
  return bucket.label
}

const template = (d: ChartRow) => {
  const items = props.connections.map(connection => ({
    label: connection.partnerName,
    value: formatNumber(d.counts[connection.id] ?? 0),
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
            Message Volume
          </p>
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatNumber(total) }}
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
      <UIcon name="i-lucide-bar-chart-2" class="size-8" />
      <p class="text-sm">No message activity for the selected filters.</p>
    </div>

    <VisXYContainer
      v-else
      :data="data"
      :padding="{ top: 24, left: 8, right: 16 }"
      class="while-unovis-chart h-96"
      :width="width"
    >
      <VisStackedBar
        :x="x"
        :y="y"
        :color="colors"
        :rounded-corners="stackedBarConfig.roundedCorners"
        :bar-padding="stackedBarConfig.barPadding"
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
      />
      <VisCrosshair color="var(--color-while-500)" :template="template" />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>
