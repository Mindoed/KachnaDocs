import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../../features/idp/views/IdpView.vue'),
    },
    { path: '/', redirect: { name: 'auth' } },
  ],
})

export default router
