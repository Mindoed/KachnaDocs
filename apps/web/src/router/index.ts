import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../AppView.vue') },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../features/auth/views/AuthView.vue'),
    },
  ],
})

export default router
