<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type: 'device' | 'server' | 'clinic'
    active?: boolean
  }>(),
  { active: true }
)

const uid = useId()
</script>

<template>
  <svg
    viewBox="0 0 88 88"
    class="topo-iso-icon size-[4.5rem] sm:size-20"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-top`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="var(--topo-face-top)" />
        <stop offset="100%" stop-color="var(--topo-face-top-end)" />
      </linearGradient>
      <linearGradient :id="`${uid}-left`" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--topo-face-left)" />
        <stop offset="100%" stop-color="var(--topo-face-left-end)" />
      </linearGradient>
      <linearGradient :id="`${uid}-right`" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--topo-face-right)" />
        <stop offset="100%" stop-color="var(--topo-face-right-end)" />
      </linearGradient>
      <filter :id="`${uid}-shadow`" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="var(--topo-shadow)" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Device: phone on plinth -->
    <g v-if="type === 'device'" :filter="`url(#${uid}-shadow)`">
      <path
        d="M18 58 L44 71 L70 58 L44 45 Z"
        fill="var(--topo-plinth)"
        stroke="var(--topo-plinth-edge)"
        stroke-width="0.75"
      />
      <path d="M34 22 L52 22 L56 58 L30 58 Z" :fill="`url(#${uid}-left)`" />
      <path d="M52 22 L62 28 L58 64 L48 58 Z" :fill="`url(#${uid}-right)`" />
      <path d="M34 22 L44 16 L62 28 L52 22 Z" :fill="`url(#${uid}-top)`" />
      <path
        d="M38 28 L54 28 L52 52 L36 52 Z"
        fill="var(--topo-screen)"
        stroke="var(--topo-screen-edge)"
        stroke-width="0.5"
        rx="1"
      />
      <circle cx="45" cy="55" r="1.5" fill="var(--topo-accent)" :opacity="active ? 1 : 0.4" />
    </g>

    <!-- Server: stacked VM blocks -->
    <g v-else-if="type === 'server'" :filter="`url(#${uid}-shadow)`">
      <path
        d="M12 62 L44 78 L76 62 L44 46 Z"
        fill="var(--topo-plinth)"
        stroke="var(--topo-plinth-edge)"
        stroke-width="0.75"
      />
      <g v-for="(y, i) in [48, 36, 24]" :key="i" :opacity="active || i === 0 ? 1 : 0.55">
        <path
          :d="`M24 ${y} L44 ${y - 10} L64 ${y} L44 ${y + 10} Z`"
          :fill="`url(#${uid}-top)`"
        />
        <path :d="`M24 ${y} L24 ${y + 14} L44 ${y + 24} L44 ${y + 10} Z`" :fill="`url(#${uid}-left)`" />
        <path :d="`M64 ${y} L64 ${y + 14} L44 ${y + 24} L44 ${y + 10} Z`" :fill="`url(#${uid}-right)`" />
        <path
          v-for="line in 3"
          :key="line"
          :d="`M30 ${y + 4 + line * 3} L58 ${y + 4 + line * 3}`"
          stroke="var(--topo-accent-soft)"
          stroke-width="1"
          stroke-linecap="round"
          opacity="0.6"
        />
      </g>
    </g>

    <!-- Clinic: hospital block + shield -->
    <g v-else :filter="`url(#${uid}-shadow)`">
      <path
        d="M14 60 L44 75 L74 60 L44 45 Z"
        fill="var(--topo-plinth)"
        stroke="var(--topo-plinth-edge)"
        stroke-width="0.75"
      />
      <path d="M28 28 L44 20 L60 28 L60 58 L28 58 Z" :fill="`url(#${uid}-left)`" />
      <path d="M60 28 L68 33 L68 63 L60 58 Z" :fill="`url(#${uid}-right)`" />
      <path d="M28 28 L44 20 L60 28 L44 36 Z" :fill="`url(#${uid}-top)`" />
      <path
        d="M40 34 h8 v8 h6 v-8 h8 v-6 h-8 v-8 h-6 v8 h-8 z"
        fill="var(--topo-accent-soft)"
        :opacity="active ? 0.9 : 0.45"
      />
      <path
        d="M58 18 L64 22 L64 34 L58 38 L52 34 L52 22 Z"
        fill="none"
        stroke="var(--topo-accent)"
        stroke-width="1.25"
        :opacity="active ? 1 : 0.5"
      />
      <path
        d="M58 24 v8 M54 28 h8"
        stroke="var(--topo-accent)"
        stroke-width="1.25"
        stroke-linecap="round"
        :opacity="active ? 1 : 0.5"
      />
    </g>
  </svg>
</template>
