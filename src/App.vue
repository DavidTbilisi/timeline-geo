<script setup lang="ts">
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
watch(locale, () => { document.title = t('nav.title') }, { immediate: true })
</script>

<template>
  <RouterView />
</template>
