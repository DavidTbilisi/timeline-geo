<script setup lang="ts">
const emit = defineEmits<{
  left: []
  right: []
}>()
</script>

<template>
  <button
    class="absolute left-[230px] top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white flex items-center justify-center transition-all backdrop-blur-sm"
    @click="emit('left')"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  </button>
  <button
    class="absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white flex items-center justify-center transition-all backdrop-blur-sm"
    style="right: 228px;"
    @click="emit('right')"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  </button>
</template>
