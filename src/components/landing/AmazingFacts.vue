<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const facts = computed(() => (tm('landing.amazingFacts') as string[]) ?? [])
const index = ref(0)
const expanded = ref(false)

function pickRandom() {
  if (!facts.value.length) return
  index.value = Math.floor(Math.random() * facts.value.length)
}

onMounted(pickRandom)

const current = computed(() => facts.value[index.value] ?? '')
</script>

<template>
  <div class="amazing-facts" data-testid="amazing-facts">
    <button
      class="w-full flex items-center justify-between gap-3 text-left group"
      @click="expanded = !expanded"
    >
      <span class="text-yellow-300/90 text-xs font-bold uppercase tracking-widest flex-shrink-0">
        {{ t('landing.amazingFactLabel') }}
      </span>
      <span class="text-white/40 text-xs">{{ expanded ? '−' : '+' }}</span>
    </button>
    <p
      v-if="expanded"
      class="text-white/70 text-xs leading-relaxed mt-2"
      data-testid="amazing-fact-body"
    >
      {{ current }}
    </p>
    <button
      v-if="expanded"
      class="text-white/30 hover:text-white/60 text-[10px] mt-2 transition-colors"
      @click.stop="pickRandom"
    >
      ↻
    </button>
  </div>
</template>

<style scoped>
.amazing-facts {
  max-width: 380px;
}
</style>
