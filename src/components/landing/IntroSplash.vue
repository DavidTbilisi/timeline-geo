<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from '@/utils/assetUrl'

const emit = defineEmits<{ launch: [] }>()

const fading = ref(false)

const introScreen = withBase('css/img/intro_screen.jpg')
const introLogo = withBase('css/img/intro_logo.png')
const introButton = withBase('css/img/intro_button.png')

function handleLaunch() {
  if (fading.value) return
  fading.value = true
  setTimeout(() => {
    emit('launch')
  }, 300)
}
</script>

<template>
  <div
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
