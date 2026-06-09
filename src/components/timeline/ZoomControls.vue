<script setup lang="ts">
defineProps<{
  current: number
  min: number
  max: number
  step: number
}>()

const emit = defineEmits<{ step: [delta: number] }>()
</script>

<template>
  <div class="tl-zoom-controls absolute bottom-3 z-30 flex flex-col items-center gap-1 pointer-events-auto">
    <button
      class="zoom-btn"
      :disabled="current >= max"
      :title="$t('timeline.zoomIn')"
      @click="emit('step', step)"
    >+</button>
    <span class="text-white/60 text-xs font-mono tabular-nums select-none">
      {{ Math.round(current * 100) }}%
    </span>
    <button
      class="zoom-btn"
      :disabled="current <= min"
      :title="$t('timeline.zoomOut')"
      @click="emit('step', -step)"
    >−</button>
  </div>
</template>

<style scoped>
/* Clear of the 220px sidebar on md+, flush right on mobile. */
.tl-zoom-controls { right: 8px; }
@media (max-width: 767px) { .tl-zoom-controls { right: 8px; } }

.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  line-height: 1;
  user-select: none;
}
.zoom-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.18); }
.zoom-btn:disabled { opacity: 0.3; cursor: default; }
</style>
