<script setup lang="ts">
import type { LinkStatus } from '~/components/connections/topology-map-types'

const props = defineProps<{
  label: string
  status: LinkStatus
  tooltip: string
  variant?: 'api' | 'vpn'
  vertical?: boolean
}>()

const uid = useId()

const linkVariant = computed(() => props.variant ?? (props.label.toLowerCase().includes('wire') ? 'vpn' : 'api'))

const accentColor = computed(() => {
  if (props.status === 'success') return 'var(--topo-accent, var(--color-while-500))'
  if (props.status === 'error') return 'var(--color-error-500, #ef4444)'
  return 'var(--color-warning-500, #f59e0b)'
})

const isAnimated = computed(() => props.status !== 'error')
</script>

<template>
  <UTooltip :text="tooltip" :content="{ side: 'top', sideOffset: 8 }">
    <div
      tabindex="0"
      class="topo-flow-connector group cursor-help outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :class="vertical
        ? 'flex flex-col items-center py-2 w-full max-w-[5.5rem] mx-auto'
        : 'flex flex-col self-center justify-center px-1 pt-10 lg:min-w-[10rem] lg:max-w-[12rem] lg:flex-1'"
      :style="{ '--flow-accent': accentColor }"
    >
      <!-- Horizontal -->
      <svg
        v-if="!vertical"
        viewBox="0 0 220 76"
        class="topo-flow-svg h-[4.75rem] w-full"
        aria-hidden="true"
      >
        <defs>
          <filter :id="`${uid}-glow`" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient :id="`${uid}-out-glow`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--flow-accent)" stop-opacity="0.15" />
            <stop offset="55%" stop-color="var(--flow-accent)" stop-opacity="0.85" />
            <stop offset="100%" stop-color="var(--flow-accent)" stop-opacity="0.35" />
          </linearGradient>
        </defs>

        <!-- Inbound: quiet reference line -->
        <line
          x1="6"
          y1="38"
          x2="68"
          y2="38"
          stroke="var(--ui-border)"
          stroke-width="1.5"
          stroke-linecap="round"
        />

        <!-- Outbound: directional request path -->
        <line
          x1="152"
          y1="38"
          x2="214"
          y2="38"
          :stroke="isAnimated ? `url(#${uid}-out-glow)` : accentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          :filter="isAnimated ? `url(#${uid}-glow)` : undefined"
        />

        <!-- Animated request pulse -->
        <g v-if="isAnimated">
          <circle r="7" fill="var(--flow-accent)" opacity="0.18">
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M152,38 L214,38" />
          </circle>
          <circle r="3" fill="var(--flow-accent)" opacity="0.95">
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M152,38 L214,38" />
          </circle>
        </g>

        <!-- Endpoint droplet -->
        <ellipse
          cx="214"
          cy="38"
          rx="4"
          ry="3"
          :fill="accentColor"
          :opacity="isAnimated ? 0.55 : 0.85"
        />

        <!-- Center label frame -->
        <g class="topo-flow-node">
          <rect
            x="68"
            y="24"
            width="84"
            height="28"
            rx="6"
            fill="var(--ui-bg-elevated)"
            stroke="var(--ui-border)"
            stroke-width="1"
          />

          <!-- Corner brackets -->
          <path d="M68 30 V24 H74" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M152 30 V24 H146" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M68 46 V52 H74" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M152 46 V52 H146" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />

          <!-- Icon -->
          <g v-if="linkVariant === 'api'" transform="translate(110, 14)" fill="var(--flow-accent)">
            <rect x="-5" y="2" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.25" />
            <path d="M-3.5 2 V0.5 C-3.5 -0.5 3.5 -0.5 3.5 0.5 V2" fill="none" stroke="currentColor" stroke-width="1.25" />
          </g>
          <g v-else transform="translate(110, 14)" fill="none" stroke="var(--flow-accent)" stroke-width="1.25">
            <path d="M0 -5 L5.5 -1.5 V3.5 C5.5 6 0 8 0 8 S-5.5 6 -5.5 3.5 V-1.5 Z" />
          </g>

          <text
            x="110"
            y="43"
            text-anchor="middle"
            class="topo-flow-label"
            fill="var(--flow-accent)"
          >
            {{ label }}
          </text>
        </g>

        <!-- Line through center (masked by box visually — draw under box as segments above) -->
        <line
          x1="68"
          y1="38"
          x2="152"
          y2="38"
          stroke="var(--ui-border)"
          stroke-width="1"
          stroke-linecap="round"
          opacity="0.45"
        />
      </svg>

      <!-- Vertical -->
      <svg
        v-else
        viewBox="0 0 76 220"
        class="topo-flow-svg h-[11rem] w-[4.75rem]"
        aria-hidden="true"
      >
        <defs>
          <filter :id="`${uid}-glow-v`" x="-80%" y="-30%" width="260%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient :id="`${uid}-out-glow-v`" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--flow-accent)" stop-opacity="0.15" />
            <stop offset="55%" stop-color="var(--flow-accent)" stop-opacity="0.85" />
            <stop offset="100%" stop-color="var(--flow-accent)" stop-opacity="0.35" />
          </linearGradient>
        </defs>

        <line
          x1="38"
          y1="6"
          x2="38"
          y2="68"
          stroke="var(--ui-border)"
          stroke-width="1.5"
          stroke-linecap="round"
        />

        <line
          x1="38"
          y1="152"
          x2="38"
          y2="214"
          :stroke="isAnimated ? `url(#${uid}-out-glow-v)` : accentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          :filter="isAnimated ? `url(#${uid}-glow-v)` : undefined"
        />

        <g v-if="isAnimated">
          <circle r="7" fill="var(--flow-accent)" opacity="0.18">
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M38,152 L38,214" />
          </circle>
          <circle r="3" fill="var(--flow-accent)" opacity="0.95">
            <animateMotion dur="1.6s" repeatCount="indefinite" path="M38,152 L38,214" />
          </circle>
        </g>

        <ellipse
          cx="38"
          cy="214"
          rx="3"
          ry="4"
          :fill="accentColor"
          :opacity="isAnimated ? 0.55 : 0.85"
        />

        <g class="topo-flow-node">
          <rect
            x="10"
            y="68"
            width="56"
            height="84"
            rx="6"
            fill="var(--ui-bg-elevated)"
            stroke="var(--ui-border)"
            stroke-width="1"
          />

          <path d="M16 68 V74 H22" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M60 68 V74 H54" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M16 152 V146 H22" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />
          <path d="M60 152 V146 H54" fill="none" stroke="var(--flow-accent)" stroke-width="1.75" stroke-linecap="round" />

          <g v-if="linkVariant === 'api'" transform="translate(38, 82)" fill="var(--flow-accent)">
            <rect x="-5" y="2" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.25" />
            <path d="M-3.5 2 V0.5 C-3.5 -0.5 3.5 -0.5 3.5 0.5 V2" fill="none" stroke="currentColor" stroke-width="1.25" />
          </g>
          <g v-else transform="translate(38, 82)" fill="none" stroke="var(--flow-accent)" stroke-width="1.25">
            <path d="M0 -5 L5.5 -1.5 V3.5 C5.5 6 0 8 0 8 S-5.5 6 -5.5 3.5 V-1.5 Z" />
          </g>

          <text
            x="38"
            y="118"
            text-anchor="middle"
            class="topo-flow-label topo-flow-label--vertical"
            fill="var(--flow-accent)"
          >
            {{ label.split(' ')[0] }}
          </text>
          <text
            v-if="label.includes(' ')"
            x="38"
            y="132"
            text-anchor="middle"
            class="topo-flow-label topo-flow-label--vertical"
            fill="var(--flow-accent)"
          >
            {{ label.split(' ').slice(1).join(' ') }}
          </text>
        </g>

        <line
          x1="38"
          y1="68"
          x2="38"
          y2="152"
          stroke="var(--ui-border)"
          stroke-width="1"
          stroke-linecap="round"
          opacity="0.45"
        />
      </svg>
    </div>
  </UTooltip>
</template>

<style scoped>
.topo-flow-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: var(--font-sans);
}

.topo-flow-label--vertical {
  font-size: 8px;
}

.topo-flow-node {
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.06));
}

html.dark .topo-flow-node {
  filter: drop-shadow(0 2px 8px rgb(0 0 0 / 0.35));
}

.topo-flow-connector:hover .topo-flow-node rect {
  stroke: color-mix(in srgb, var(--flow-accent) 35%, var(--ui-border));
}
</style>
