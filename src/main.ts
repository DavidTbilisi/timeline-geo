import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import { router } from './router'
import { log } from './utils/log'
import './style.css'
import App from './App.vue'

log.boot('starting app', { dev: import.meta.env.DEV, base: import.meta.env.BASE_URL })

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  log.error('vue errorHandler', { info, component: instance?.$options?.name }, err)
}
window.addEventListener('error', (e) => log.error('window error', e.message, e.error))
window.addEventListener('unhandledrejection', (e) => log.error('unhandledrejection', e.reason))

app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')

log.boot('app mounted', { locale: i18n.global.locale.value })
