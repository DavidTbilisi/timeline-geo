<script setup lang="ts">
import type { Era } from '@lib/types'
import { useTimelineConfig } from '@lib/config'
import { useLocalized } from '@lib/i18n'
import { resolveAsset } from '@lib/theme'

const config = useTimelineConfig()
const { l } = useLocalized()

/**
 * Arch geometry (px, inside .arches). An authored `era.arch` wins; otherwise
 * the arch spans the era's cards, inset by `landingArchInset` on each side.
 */
function archStyle(era: Era) {
  if (era.arch) return { left: era.arch.left + 'px', width: era.arch.width + 'px' }
  const L = config.layout
  const indexes = era.periods.map(id => config.byId[id]?.index).filter((i): i is number => i != null)
  if (!indexes.length) return {}
  const first = Math.min(...indexes)
  const last = Math.max(...indexes)
  const pitch = L.landingCardWidth + L.landingCardGap
  const left = L.landingPadding + first * pitch + L.landingArchInset
  const width = (last - first) * pitch + L.landingCardWidth - 2 * L.landingArchInset
  return { left: left + 'px', width: width + 'px' }
}
</script>

<template>
  <div class="arches">
    <div
      v-for="era in config.eras"
      :key="era.id"
      :class="`arch arch-${era.id}`"
      :style="archStyle(era)"
      :data-era="era.id"
      :data-testid="`era-arch-${era.id}`"
    >
      <h3>
        <img v-if="era.logo" :src="resolveAsset(config, era.logo)" :alt="l(era.name)" />
        <template v-else>{{ l(era.name) }}</template>
      </h3>
      <p>{{ l(era.description) }}</p>
    </div>
  </div>
</template>
