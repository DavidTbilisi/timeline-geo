<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="welcome-panel" data-testid="welcome-panel">
    <h3 class="text-white font-semibold text-lg mb-1" data-testid="welcome-heading">
      {{ t('landing.welcome.heading') }}
    </h3>
    <p class="text-white/60 text-xs leading-relaxed">
      {{ t('landing.welcome.body') }}
    </p>
  </div>
</template>

<style scoped>
.welcome-panel {
  max-width: 380px;
}
</style>
