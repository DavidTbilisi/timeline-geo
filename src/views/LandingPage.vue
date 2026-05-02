<script setup lang="ts">
import { ref } from 'vue'
import LandingView from '@/components/landing/LandingView.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import IntroSplash from '@/components/landing/IntroSplash.vue'

const showIntro = ref(sessionStorage.getItem('tl-intro-seen') !== '1')

function onLaunch() {
  sessionStorage.setItem('tl-intro-seen', '1')
  showIntro.value = false
}
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-stone-900">
    <AppMenu />
    <LandingView />
    <IntroSplash v-if="showIntro" @launch="onLaunch" />
  </div>
</template>
