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
        <p v-if="submitted" class="text-yellow-400/80 text-xs text-center">
          {{ t('detail.noContent') }}
        </p>
      </form>

      <!--
        Removed the "create a new BibleHistory.com account" section and
        the "forgot password" link, both of which pointed at upstream
        biblehistory.com URLs that aren't part of this project. See
        issue #57. Auth backend isn't wired up — the sign-in form is a
        no-op stub. The whole modal should probably be hidden until
        there's a real backend (tracked in #12), but until then the
        brand reference is gone.
      -->
    </div>
  </div>
</template>
