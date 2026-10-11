import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'auth' } },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../features/auth/views/AuthView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../features/dashboard/views/DashboardView.vue'),
    },
  ],
})

export default router
