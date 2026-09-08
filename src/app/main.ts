import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { createTimeline, installRouterLogging, log } from '@lib/index'
import { bibleConfig } from './timeline.config'
import './style.css'
import App from './App.vue'

const timeline = createTimeline(bibleConfig)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: timeline.routes,
})
installRouterLogging(router)

const i18n = createI18n({
  legacy: false,
  locale: timeline.initialLocale(),
  fallbackLocale: timeline.config.locales.fallback,
  messages: timeline.messages,
})

log.boot('starting app', { dev: import.meta.env.DEV, base: import.meta.env.BASE_URL })

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  log.error('vue errorHandler', { info, component: instance?.$options?.name }, err)
}
window.addEventListener('error', (e) => log.error('window error', e.message, e.error))
window.addEventListener('unhandledrejection', (e) => log.error('unhandledrejection', e.reason))

// The timeline plugin must be installed before anything that reads the
// config (stores, router guards, i18n-driven title).
app.use(timeline)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')

log.boot('app mounted', { locale: i18n.global.locale.value })
