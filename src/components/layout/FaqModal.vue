<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineEmits<{ (e: 'close'): void }>()

const { t, tm } = useI18n()

interface FaqItem { q: string; a: string }
const items = computed(() => (tm('faq.items') as FaqItem[]) ?? [])
const activeIndex = ref(0)
</script>

<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    data-testid="faq-modal"
    @click.self="$emit('close')"
  >
    <div class="bg-stone-900 border border-white/10 rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <h2 class="text-white font-bold text-lg">{{ t('faq.title') }}</h2>
        <button
          class="text-white/50 hover:text-white text-sm px-3 py-1 transition-colors"
          @click="$emit('close')"
        >
          {{ t('faq.close') }} ✕
        </button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Question list -->
        <ul class="w-1/3 border-r border-white/10 overflow-y-auto p-2">
          <li
            v-for="(item, i) in items"
            :key="i"
          >
            <button
              class="w-full text-left text-xs px-3 py-2 rounded transition-colors leading-snug"
              :class="i === activeIndex ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90'"
              @click="activeIndex = i"
            >
              {{ item.q }}
            </button>
          </li>
        </ul>

        <!-- Answer pane -->
        <div class="flex-1 overflow-y-auto p-6">
          <h3 class="text-white font-semibold text-base mb-3">
            {{ items[activeIndex]?.q }}
          </h3>
          <p class="text-white/75 text-sm leading-relaxed whitespace-pre-line">
            {{ items[activeIndex]?.a }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
