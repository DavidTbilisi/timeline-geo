import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory('/'),
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
    },
    {
      path: '/event/:slug',
      component: () => import('@/views/TimelinePage.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})
