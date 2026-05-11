import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // ✅ Public login route
  {
    path: '/login',
    component: () => import('/layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/LoginPage.vue')
      }
    ]
  },

  // ✅ Protected application routes
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
      },
    ],
  },

  // ✅ Always leave this last
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
