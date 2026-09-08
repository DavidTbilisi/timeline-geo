<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalized } from '@lib/i18n'
import type { LocalizedString } from '@lib/types'
// Bible-specific panel: reads its own content until it becomes a landing plugin.
import factsJson from '@content/amazing-facts.json'

const { t } = useI18n()
const { l } = useLocalized()

const facts = factsJson as LocalizedString[]
const index = ref(0)

function pickRandom() {
  if (!facts.length) return
  index.value = Math.floor(Math.random() * facts.length)
}

onMounted(pickRandom)

const current = computed(() => l(facts[index.value]))

const emit = defineEmits<{ expand: [expanded: boolean] }>()
const expanded = ref(false)

function toggle() {
  pickRandom()
  expanded.value = !expanded.value
  emit('expand', expanded.value)
}
</script>

<!--
  Landing footer panel (Bible dataset): renders the .bar + .info sub-elements
  of .landing-footer and emits `expand` so LandingView toggles `.active`.
-->
<template>
  <div class="bar" data-testid="amazing-facts" @click="toggle">
    <div class="fact">
      {{ t('landing.amazingFactLabel') }}
      <span class="closed">^</span>
      <span class="opened">v</span>
    </div>
    <div class="toggle">
      <span class="plus">+</span>
      <span class="minus">&ndash;</span>
    </div>
    <div class="copy">&nbsp;</div>
  </div>
  <div class="info" data-testid="amazing-fact-body">
    <div class="image" />
    <div class="af_logo" />
    <p>{{ current }}</p>
  </div>
</template>
