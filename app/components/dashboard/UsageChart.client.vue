<script setup lang="ts">
import {
  VisArea,
  VisAxis,
  VisCrosshair,
  VisLine,
  VisTooltip,
  VisXYContainer
} from '~/utils/unovis'
import { buildChartTooltipHtml, formatChartTooltipDateUtc } from '~/utils/chartTooltip'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { chartData } = useUsageMetrics()
const { width } = useElementSize(cardRef)

type DataRecord = {
  date: string
  messages: number
  fhirResources: number
}

const data = computed<DataRecord[]>(() => chartData.value)

const x = (_: DataRecord, i: number) => i
const yMessages = (d: DataRecord) => d.messages
const yFhir = (d: DataRecord) => d.fhirResources

const totalMessages = computed(() => data.value.reduce((acc, { messages }) => acc + messages, 0))
const totalFhir = computed(() => data.value.reduce((acc, { fhirResources }) => acc + fhirResources, 0))

const formatNumber = new Intl.NumberFormat('en').format

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
  return formatDate(data.value[i].date)
}

const series = [
  { label: 'Messages', color: 'var(--color-while-600)' },
  { label: 'FHIR Resources', color: 'var(--color-while-400)' }
] as const

const template = (d: DataRecord) => {
  const values = [formatNumber(d.messages), formatNumber(d.fhirResources)]

  return buildChartTooltipHtml(
    formatChartTooltipDateUtc(`${d.date}T00:00:00.000Z`),
    series.map((item, index) => ({
      label: item.label,
      value: values[index]!,
      color: item.color
    }))
  )
}
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }">
    <template #header>
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Message Throughput
          </p>
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatNumber(totalMessages) }}
          </p>
          <p class="text-xs text-muted mt-1">Last 14 days</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted uppercase mb-1.5">
            FHIR Resources
          </p>
          <p class="text-xl text-highlighted font-semibold">
            {{ formatNumber(totalFhir) }}
          </p>
          <div class="flex items-center justify-end gap-3 mt-2 text-xs text-muted">
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-primary ring-1 ring-inset ring-default" />
              Messages
            </span>
            <span class="flex items-center gap-1">
              <span class="size-2 rounded-full bg-success ring-1 ring-inset ring-default" />
              FHIR
            </span>
          </div>
        </div>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40, left: 8, right: 16 }"
      class="while-unovis-chart h-96"
      :width="width"
    >
      <VisLine :x="x" :y="yMessages" color="var(--color-while-600)" />
      <VisArea :x="x" :y="yMessages" color="var(--color-while-500)" :opacity="0.12" />
      <VisLine :x="x" :y="yFhir" color="var(--color-while-400)" :line-width="2" />
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
