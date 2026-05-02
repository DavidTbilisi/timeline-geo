<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const facts = computed(() => (tm('landing.amazingFacts') as string[]) ?? [])
const index = ref(0)

function pickRandom() {
  if (!facts.value.length) return
  index.value = Math.floor(Math.random() * facts.value.length)
}

onMounted(pickRandom)

const current = computed(() => facts.value[index.value] ?? '')

const emit = defineEmits<{ toggle: [] }>()

function toggle() {
  pickRandom()
  emit('toggle')
}
</script>

<!--
  Renders the .bar + .info sub-elements of .landing-footer.
  The parent (.landing-footer wrapper in LandingView) applies the `active`
  class based on the emitted `toggle` events.
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
