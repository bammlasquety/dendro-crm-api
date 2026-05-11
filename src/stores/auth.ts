import { defineStore } from 'pinia'
import { supabase } from '../boot/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: true,
  }),
  actions: {
    async init() {
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user ?? null
      this.loading = false

      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
      })
    },
    async signInWithGoogle() {
      await supabase.auth.signInWithOAuth({ provider: 'google' })
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  },
})
