<script setup lang="ts">
import type { TopologyNode } from '~/components/connections/topology-map-types'

defineProps<{
  node: TopologyNode
  layerLabel: string
  iconType: 'device' | 'server' | 'clinic'
  active?: boolean
}>()
</script>

<template>
  <div class="topo-iso-node flex flex-col items-center">
    <span class="topo-iso-layer-label">{{ layerLabel }}</span>

    <div class="topo-iso-stage">
      <!-- Wireframe enclosure -->
      <svg
        viewBox="0 0 200 148"
        class="topo-iso-wireframe pointer-events-none absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d="M24 88 L100 126 L176 88 L100 50 Z"
          fill="var(--topo-wire-fill)"
          stroke="var(--topo-wire-edge)"
          stroke-width="1"
          stroke-dasharray="4 3"
        />
        <path
          d="M24 88 L24 52 L100 14 L176 52 L176 88 L100 126 Z"
          fill="none"
          stroke="var(--topo-wire-edge)"
          stroke-width="1.25"
          stroke-dasharray="5 4"
          opacity="0.85"
        />
        <path
          d="M100 14 L100 50"
          stroke="var(--topo-wire-edge)"
          stroke-width="1"
          stroke-dasharray="4 3"
          opacity="0.6"
        />
        <path
          d="M24 52 L100 14 L176 52"
          fill="none"
          stroke="var(--topo-wire-highlight)"
          stroke-width="1.5"
          opacity="0.5"
        />
      </svg>

      <div class="topo-iso-icon-wrap">
        <ConnectionsTopologyIsometricIcon :type="iconType" :active="active !== false" />
      </div>
    </div>

    <div class="topo-iso-meta mt-3 w-full text-center">
      <p class="truncate text-sm font-semibold text-highlighted">
        {{ node.title }}
      </p>
      <p class="truncate text-xs text-muted">
        {{ node.subtitle }}
      </p>
    </div>

    <div class="mt-3 flex flex-wrap justify-center gap-1.5 px-1">
      <ConnectionsTopologyBadgePill
        v-for="(badge, badgeIndex) in node.badges"
        :key="badgeIndex"
        v-bind="badge"
      />
    </div>
  </div>
</template>

<style scoped>
.topo-iso-node {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1 1 0;
}

.topo-iso-layer-label {
  display: inline-flex;
  margin-bottom: 0.5rem;
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--topo-accent);
  background: color-mix(in srgb, var(--topo-accent) 10%, var(--ui-bg-elevated));
  border: 1px solid color-mix(in srgb, var(--topo-accent) 22%, var(--ui-border));
}

.topo-iso-stage {
  position: relative;
  width: 100%;
  max-width: 13rem;
  aspect-ratio: 200 / 148;
  margin: 0 auto;
}

.topo-iso-icon-wrap {
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.topo-iso-wireframe {
  opacity: 0.95;
}
</style>
