<script setup lang="ts">
import { computed } from 'vue'
import type { EventDetail } from 'timeline-geo'

/**
 * A dataset-specific detail tab: renders `extensions.notes` (string[]).
 * Tabs receive `{ detail, periodColor }` (DetailTabProps); the props are
 * spelled out here because Vue's SFC compiler resolves prop types locally.
 */
const props = defineProps<{ detail: EventDetail; periodColor: string }>()
const notes = computed(() => ((props.detail.extensions as { notes?: string[] } | undefined)?.notes) ?? [])
</script>

<template>
  <ul v-if="notes.length" class="space-y-2 text-sm text-white/80 list-disc pl-5">
    <li v-for="(n, i) in notes" :key="i">{{ n }}</li>
  </ul>
  <p v-else class="text-white/40 text-sm italic">No notes for this event.</p>
</template>
