<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useTimelineConfig } from '@lib/config'
import { useLocalized } from '@lib/i18n'

const config = useTimelineConfig()
const { l } = useLocalized()
watchEffect(() => { document.title = l(config.title) })
</script>

<template>
  <RouterView />
</template>
