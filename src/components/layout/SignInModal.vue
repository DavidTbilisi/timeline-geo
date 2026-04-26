<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()

const email = ref('')
const password = ref('')
const submitted = ref(false)

function onSubmit() {
  // Auth backend (php/account.php) is unavailable in the static rebuild.
  // Show a stub state so the form is at least interactive.
  submitted.value = true
}
</script>

<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    data-testid="signin-modal"
    @click.self="$emit('close')"
  >
    <div class="bg-stone-900 border border-white/10 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 pt-5 pb-3 border-b border-white/10">
        <p class="text-white/40 text-xs uppercase tracking-widest mb-1">{{ t('account.heading') }}</p>
        <div class="flex items-center justify-between">
          <h2 class="text-white font-bold text-lg">{{ t('account.signInTitle') }}</h2>
          <button
            class="text-white/50 hover:text-white text-sm transition-colors"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Form -->
      <form class="p-6 space-y-3" @submit.prevent="onSubmit">
        <input
          v-model="email"
          type="email"
          required
          :placeholder="t('account.email')"
          class="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
        />
        <input
          v-model="password"
          type="password"
          required
          :placeholder="t('account.password')"
          class="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
        />
        <button
          type="submit"
          class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold py-2 rounded transition-colors"
        >
          {{ t('account.submit') }}
        </button>
        <p class="text-center">
          <a
            href="http://www.biblehistory.com/accounts/recover_password.php"
            target="_blank"
            rel="noopener"
            class="text-white/50 hover:text-white/80 text-xs underline"
          >
            {{ t('account.forgot') }}
          </a>
        </p>
        <p v-if="submitted" class="text-yellow-400/80 text-xs text-center">
          {{ t('detail.noContent') }}
        </p>
      </form>

      <!-- Create new -->
      <div class="px-6 pb-6 border-t border-white/10 pt-4 space-y-2">
        <p class="text-white font-semibold text-sm">{{ t('account.createNew') }}</p>
        <p class="text-white/60 text-xs leading-relaxed">{{ t('account.createBody1') }}</p>
        <p class="text-white/60 text-xs leading-relaxed">{{ t('account.createBody2') }}</p>
        <p class="text-white/60 text-xs leading-relaxed">{{ t('account.createBody3') }}</p>
        <a
          href="http://www.biblehistory.com/accounts/create.php"
          target="_blank"
          rel="noopener"
          class="block w-full text-center bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-200 text-sm font-semibold py-2 rounded transition-colors mt-2"
        >
          {{ t('account.createCta') }}
        </a>
      </div>
    </div>
  </div>
</template>
