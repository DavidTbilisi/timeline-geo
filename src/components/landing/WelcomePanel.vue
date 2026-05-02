<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<!--
  Renders the .welcome sub-element of .landing-footer.
  Must be placed inside a .landing-footer wrapper.
-->
<template>
  <div class="welcome" data-testid="welcome-panel">
    <h3 data-testid="welcome-heading">{{ t('landing.welcome.heading') }}</h3>
    <p>{{ t('landing.welcome.body') }}</p>
  </div>
</template>
