<script setup lang="ts">
import {
  VisAxis,
  VisCrosshair,
  VisLine,
  VisTooltip,
  VisXYContainer,
  getChartHeroColor
} from '~/utils/unovis'
import { buildChartTooltipHtml, formatChartTooltipDateUtc } from '~/utils/chartTooltip'
import type { UsageDataPoint } from '~/types/while'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { chartData } = useUsageMetrics()
const { connections } = useConnections()
const { enrichPoints } = useOverviewChart()
const { width } = useElementSize(cardRef)

type DataRecord = UsageDataPoint

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'All'

const timeframe = ref<Timeframe>('1M')
const timeframeOptions: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'All']

const sliceByTimeframe: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 14,
  '3M': 14,
  '1Y': 14,
  'All': 14
}

const rawData = computed<DataRecord[]>(() => chartData.value)

const data = computed<DataRecord[]>(() => {
  const n = sliceByTimeframe[timeframe.value]
  const slice = rawData.value.slice(-n)
  return enrichPoints(slice)
})

const chartSeries = computed(() =>
  connections.value.map((connection, index) => ({
    id: connection.id,
    label: connection.partnerName,
    color: getChartHeroColor(index)
  }))
)

const x = (_: DataRecord, i: number) => i

const yAccessors = computed(() =>
  chartSeries.value.map(series => (d: DataRecord) => d.byConnection[series.id] ?? 0)
)

const totalMessages = computed(() => data.value.reduce((acc, { messages }) => acc + messages, 0))

const averageUptime = computed(() => {
  if (!data.value.length) return 0
  const sum = data.value.reduce((acc, { uptime }) => acc + uptime, 0)
  return Math.round((sum / data.value.length) * 10) / 10
})

const formatNumber = new Intl.NumberFormat('en').format

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
  return formatDate(data.value[i].date)
}

const chartPadding = { top: 24, left: 8, right: 16, bottom: 8 }

const template = (d: DataRecord) => {
  const items = chartSeries.value.map(series => ({
    label: series.label,
    value: formatNumber(d.byConnection[series.id] ?? 0),
    color: series.color
  }))

  items.push({
    label: 'Total',
    value: formatNumber(d.messages),
    color: '#FAFAFA'
  })

  return buildChartTooltipHtml(
    formatChartTooltipDateUtc(`${d.date}T00:00:00.000Z`),
    items
  )
}
</script>

<template>
  <div
    ref="cardRef"
    class="while-chart-surface flex h-full min-h-0 flex-col overflow-visible rounded-xl p-5 ring-1"
  >
    <div class="flex items-start justify-between gap-4 shrink-0">
      <div class="min-w-0 flex-1">
        <p class="while-chart-label text-xs font-medium uppercase tracking-wide">
          Message throughput
        </p>
        <div class="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p class="while-chart-value text-3xl font-semibold tabular-nums">
            {{ formatNumber(totalMessages) }}
          </p>
          <p class="while-chart-label text-sm tabular-nums">
            {{ averageUptime }}% avg uptime
          </p>
        </div>
        <p class="while-chart-meta mt-0.5 text-xs">
          {{ timeframe }} · {{ data.length }} day{{ data.length === 1 ? '' : 's' }} · by connection
        </p>
        <div
          v-if="chartSeries.length"
          class="mt-2 flex flex-wrap gap-x-3 gap-y-1"
        >
          <span
            v-for="series in chartSeries"
            :key="series.id"
            class="while-chart-legend inline-flex max-w-[10rem] items-center gap-1.5 text-[10px]"
          >
            <span
              class="while-chart-swatch size-2 shrink-0 rounded-full"
              :style="{ backgroundColor: series.color }"
            />
            <span class="truncate">{{ series.label }}</span>
          </span>
        </div>
      </div>
      <div class="flex shrink-0 gap-1 text-xs">
        <button
          v-for="option in timeframeOptions"
          :key="option"
          type="button"
          class="while-chart-timeframe px-2 py-1 rounded-md transition-colors"
          :class="{ 'while-chart-timeframe--active underline underline-offset-4': timeframe === option }"
          @click="timeframe = option"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div class="mt-4 min-h-72 flex-1">
      <VisXYContainer
        :data="data"
        :padding="chartPadding"
        class="while-unovis-chart while-unovis-chart--hero h-full min-h-72"
        :width="width"
      >
        <VisLine
          v-for="(accessor, index) in yAccessors"
          :key="chartSeries[index]?.id ?? index"
          :x="x"
          :y="accessor"
          :color="chartSeries[index]?.color"
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
          :num-ticks="4"
        />
        <VisCrosshair color="rgb(250 250 250 / 0.75)" :template="template" />
        <VisTooltip />
      </VisXYContainer>
    </div>
  </div>
</template>
