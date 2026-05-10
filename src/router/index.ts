import { createRouter, createWebHistory } from 'vue-router'
import { PERIOD_BY_SLUG } from '@/data/periods'
import { log } from '@/utils/log'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/LandingPage.vue'),
    },
    {
      path: '/home',
      component: () => import('@/views/LandingPage.vue'),
    },
    {
      path: '/period/:slug',
      component: () => import('@/views/TimelinePage.vue'),
      props: true,
      // Bogus slug like /period/does-not-exist used to silently fall back
      // to First Generation (period 1). Redirect to home instead, with the
      // URL replaced so back-button doesn't bounce through the bad path.
      // See issue #50.
      beforeEnter: (to) => {
        const slug = to.params.slug as string
        if (!PERIOD_BY_SLUG[slug]) {
          log.route('unknown period slug, redirecting to /', { slug })
          return '/'
        }
      },
    },
    {
      path: '/event/:slug',
      component: () => import('@/views/TimelinePage.vue'),
      props: true,
    },
    // Catch-all: any other path redirects to home. `redirect` uses replace
    // navigation, so the bogus URL doesn't land in history. See issue #51.
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => {
        log.route('catch-all redirect to /', { from: to.fullPath })
        return '/'
      },
    },
  ],
})

router.beforeEach((to, from) => {
  log.route('nav', { from: from.fullPath, to: to.fullPath, params: to.params })
})

router.afterEach((to, from, failure) => {
  if (failure) log.warn('route nav failed', { from: from.fullPath, to: to.fullPath, failure })
  else log.route('nav done', { to: to.fullPath })
})

router.onError((err) => log.error('router error', err))
