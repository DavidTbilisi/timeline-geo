<script setup lang="ts">
import { useTimelineConfig } from '../../config'
import { useLocalized } from '../../i18n'

const config = useTimelineConfig()
const { l } = useLocalized()
const welcome = config.content.welcome
</script>

<!--
  Renders the .welcome sub-element of .landing-footer.
  Must be placed inside a .landing-footer wrapper.
-->
<template>
  <div v-if="welcome" class="welcome" data-testid="welcome-panel">
    <h3 data-testid="welcome-heading">{{ l(welcome.heading) }}</h3>
    <p>{{ l(welcome.body) }}</p>
  </div>
</template>
