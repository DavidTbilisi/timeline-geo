<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useTimelineConfig, useLocalized } from 'timeline-geo'

const config = useTimelineConfig()
const { l } = useLocalized()
watchEffect(() => { document.title = l(config.title) })
</script>

<template>
  <RouterView />
</template>

<style>
#app { width: 100%; height: 100%; overflow: hidden; position: relative; }
</style>
