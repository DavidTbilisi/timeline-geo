<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import type { Video } from '@/types/detail'

const props = defineProps<{
  videos: Video[]
}>()

const activeIndex = ref(0)
const videoEl = ref<HTMLVideoElement | null>(null)

function selectVideo(idx: number) {
  if (idx === activeIndex.value) return
  // Pause and reset current video before switching
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.currentTime = 0
  }
  activeIndex.value = idx
}

// Pause + reset when the component is unmounted (tab switched away or panel closed)
onUnmounted(() => {
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.currentTime = 0
  }
})

// When active video changes, reset the new player
watch(activeIndex, () => {
  // The DOM has updated but videoEl ref might still point to the old element;
  // a nextTick isn't needed because the watcher fires after the reactive change —
  // the template re-renders and videoEl gets the new <video>.  We just load it.
  if (videoEl.value) {
    videoEl.value.load()
  }
})

const currentVideo = () => props.videos[activeIndex.value] ?? props.videos[0]
</script>

<template>
  <div class="flex flex-col h-full w-full" data-testid="detail-videos">
    <!-- Multi-video selector list (only shown when there is more than one video) -->
    <div
      v-if="videos.length > 1"
      class="flex flex-col gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0 overflow-y-auto max-h-36"
      data-testid="video-list"
    >
      <button
        v-for="(vid, idx) in videos"
        :key="idx"
        class="text-left px-3 py-2 rounded text-xs transition-colors truncate"
        :class="idx === activeIndex
          ? 'bg-white/15 text-white font-semibold'
          : 'text-white/50 hover:text-white/80 hover:bg-white/10'"
        @click="selectVideo(idx)"
      >
        {{ vid.title }}
      </button>
    </div>

    <!-- Video player -->
    <div class="flex-1 flex flex-col min-h-0 p-3 gap-2">
      <div class="relative w-full flex-1 bg-black rounded overflow-hidden min-h-0">
        <video
          ref="videoEl"
          controls
          class="w-full h-full object-contain"
          :key="activeIndex"
          data-testid="video-player"
        >
          <source :src="currentVideo().filename" type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>
      </div>

      <!-- Title (only for single-video; for multi-video the list already shows all titles) -->
      <p
        v-if="videos.length === 1"
        class="text-white/80 text-sm font-semibold flex-shrink-0"
      >
        {{ currentVideo().title }}
      </p>

      <!-- Caption -->
      <p
        v-if="currentVideo().caption"
        class="text-white/50 text-xs flex-shrink-0"
        v-html="currentVideo().caption"
      />
    </div>
  </div>
</template>
