<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EventImage } from '@/types/detail'

const props = defineProps<{
  images: EventImage[]
  periodColor?: string
}>()

const current = ref(0)
const errors = ref<Set<number>>(new Set())

function onError(i: number) {
  errors.value = new Set([...errors.value, i])
}

const validImages = computed(() =>
  props.images
    .map((img, i) => ({ img, i }))
    .filter(({ i }) => !errors.value.has(i))
)

const currentValid = computed(() => {
  const valid = validImages.value
  if (valid.length === 0) return null
  // Clamp current index to valid images
  const idx = Math.min(current.value, valid.length - 1)
  return valid[idx]
})

function prev() {
  if (validImages.value.length > 1) {
    current.value = (current.value - 1 + validImages.value.length) % validImages.value.length
  }
}

function next() {
  if (validImages.value.length > 1) {
    current.value = (current.value + 1) % validImages.value.length
  }
}
</script>

<template>
  <div class="flex flex-col items-center w-full h-full select-none">
    <!-- Hidden preload imgs to detect errors -->
    <img
      v-for="(img, i) in images"
      :key="i"
      :src="`/media/images/original/${img.file}`"
      class="hidden"
      @error="onError(i)"
    />

    <template v-if="currentValid">
      <!-- Main image area -->
      <div class="relative w-full flex-1 bg-black overflow-hidden min-h-0">
        <img
          :src="`/media/images/original/${currentValid.img.file}`"
          :alt="currentValid.img.caption"
          class="absolute inset-0 w-full h-full object-contain"
        />

        <!-- Prev / Next arrows (only when multiple valid images) -->
        <template v-if="validImages.length > 1">
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Previous image"
            @click="prev"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Next image"
            @click="next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </template>
      </div>

      <!-- Caption -->
      <p
        v-if="currentValid.img.caption"
        class="text-white/60 text-xs text-center px-4 py-2 flex-shrink-0"
      >
        {{ currentValid.img.caption }}
      </p>

      <!-- Pagination dots -->
      <div
        v-if="validImages.length > 1"
        class="flex gap-2 pb-3 flex-shrink-0"
        data-testid="image-dots"
      >
        <button
          v-for="(item, idx) in validImages"
          :key="item.i"
          class="w-2 h-2 rounded-full transition-all"
          :class="idx === current ? 'scale-125' : 'bg-white/30 hover:bg-white/50'"
          :style="idx === current ? { background: periodColor ?? '#fff' } : {}"
          :aria-label="`Image ${idx + 1}`"
          @click="current = idx"
        />
      </div>
    </template>

    <div v-else class="flex-1 flex items-center justify-center text-white/30 text-sm">
      No images available
    </div>
  </div>
</template>
