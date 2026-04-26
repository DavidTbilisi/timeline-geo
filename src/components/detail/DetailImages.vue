<script setup lang="ts">
import { ref } from 'vue'
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

const validImages = () => props.images.filter((_, i) => !errors.value.has(i))
</script>

<template>
  <div class="relative flex-shrink-0 bg-black overflow-hidden"
    :style="{ height: validImages().length ? '200px' : '0px', transition: 'height 0.2s' }">

    <!-- Hidden preload images to detect errors -->
    <img
      v-for="(img, i) in images"
      :key="i"
      :src="`/${img.file}`"
      class="hidden"
      @error="onError(i)"
    />

    <!-- Visible image -->
    <template v-if="validImages().length">
      <img
        :src="`/${images[current].file}`"
        :alt="images[current].caption"
        class="absolute inset-0 w-full h-full object-cover"
        style="opacity: 0.85;"
      />
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      <p v-if="images[current].caption" class="absolute bottom-3 left-4 text-white/70 text-xs">
        {{ images[current].caption }}
      </p>

      <div v-if="images.length > 1" class="absolute bottom-3 right-4 flex gap-1.5">
        <button
          v-for="(_, i) in images"
          :key="i"
          class="w-2 h-2 rounded-full transition-all"
          :class="i === current ? 'bg-white scale-125' : 'bg-white/30'"
          @click="current = i"
        />
      </div>
    </template>
  </div>
</template>
