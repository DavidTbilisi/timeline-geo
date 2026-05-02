<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ launch: [] }>()

const fading = ref(false)

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
    style="transition: opacity 300ms ease; background: url('/css/img/intro_screen.jpg') center center / cover no-repeat;"
    @click="handleLaunch"
  >
    <div class="flex flex-col items-center gap-8" @click.stop="handleLaunch">
      <img
        src="/css/img/intro_logo.png"
        alt="Timeline logo"
        class="max-w-xs w-full pointer-events-none"
      />
      <img
        src="/css/img/intro_button.png"
        alt="Launch timeline"
        class="cursor-pointer hover:opacity-80 transition-opacity"
      />
    </div>
  </div>
</template>
