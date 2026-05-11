import { defineRouter } from '#q-app/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from 'boot/supabase'

export default defineRouter(() => {
  const Router = createRouter({
    history: createWebHistory(),
    routes: [
      // ✅ AUTH ROUTES
      {
        path: '/login',
        component: () => import('layouts/AuthLayout.vue'),
        meta: { public: true },
        children: [
          {
            path: '',
            component: () => import('pages/LoginPage.vue'),
          },
        ],
      },

      // ✅ PROTECTED APP ROUTES (DRAWER LIVES HERE)
      {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
          {
            path: '',
            redirect: '/dashboard',
          },
          {
            path: 'dashboard',
            component: () => import('pages/IndexPage.vue'),
          },
          {
            path: 'customers',
            component: () => import('pages/CustomerLeads.vue'),
          },
          // add more here:
          // { path: 'companies', component: () => import('pages/CompaniesPage.vue') }
          // { path: 'campaigns', component: () => import('pages/CampaignsPage.vue') }
        ],
      },

      // ✅ CATCH‑ALL ERROR PAGE (KEEP LAST)
      {
        path: '/:catchAll(.*)*',
        component: () => import('layouts/MainLayout.vue'),
        children: [
          {
            path: '',
            component: () => import('pages/ErrorNotFound.vue'),
          },
        ],
      },
    ],
  })

  // ✅ AUTH GUARD
  Router.beforeEach(async (to) => {
    if (to.meta?.public) return true

    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      return { path: '/login' }
    }

    return true
  })

  return Router
})
