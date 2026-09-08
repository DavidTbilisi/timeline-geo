<script setup lang="ts">
import { ref } from 'vue'
import { useTimelineConfig } from '@lib/config'
import { resolveAsset } from '@lib/theme'

const STORAGE_KEY = 'tl-intro-seen'
function seen(): boolean {
  try { return sessionStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

/** Shown once per session (landing overlay panel). */
const show = ref(!seen())
const fading = ref(false)

const config = useTimelineConfig()
const introScreen = resolveAsset(config, 'css/img/intro_screen.jpg')
const introLogo = resolveAsset(config, 'css/img/intro_logo.png')
const introButton = resolveAsset(config, 'css/img/intro_button.png')

function handleLaunch() {
  if (fading.value) return
  fading.value = true
  setTimeout(() => {
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* storage blocked */ }
    show.value = false
  }, 300)
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none"
    :class="fading ? 'opacity-0' : 'opacity-100'"
    :style="`transition: opacity 300ms ease; background: url('${introScreen}') center center / cover no-repeat;`"
    @click="handleLaunch"
  >
    <div class="flex flex-col items-center gap-8" @click.stop="handleLaunch">
      <img
        :src="introLogo"
        alt="Timeline logo"
        class="max-w-xs w-full pointer-events-none"
      />
      <img
        :src="introButton"
        alt="Launch timeline"
        class="cursor-pointer hover:opacity-80 transition-opacity"
      />
    </div>
  </div>
</template>
