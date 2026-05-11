<template>
  <q-page class="flex flex-center">
    <!-- Background -->
    <div class="absolute-full bg-grey-1"></div>

    <q-card class="q-pa-lg shadow-10" style="width: 420px; max-width: 92vw; z-index: 1;">
      <!-- Header -->
      <q-card-section class="text-center">
        <q-avatar size="64px" color="green-7" text-color="white" class="q-mb-md">
          <q-icon name="spa" size="32px" />
        </q-avatar>

        <div class="text-h5 text-weight-bold">Dendrotonics CRM</div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">Customer Management</div>
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-input
            v-if="!isLogin"
            v-model.trim="name"
            label="Full Name"
            outlined
            :rules="[val => (!!val && val.length > 1) || 'Name is required']"
            autocomplete="name"
          />

          <q-input
            v-model.trim="email"
            label="Email"
            type="email"
            outlined
            :rules="[
              val => !!val || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Enter a valid email'
            ]"
            autocomplete="email"
          />

          <q-input
            v-model="password"
            label="Password"
            type="password"
            outlined
            :rules="[val => !!val || 'Password is required']"
            autocomplete="current-password"
          />

          <q-banner v-if="error" dense class="bg-red-1 text-red-9 rounded-borders">
            <template #avatar>
              <q-icon name="error" />
            </template>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            color="green-7"
            unelevated
            class="full-width"
            :loading="loading"
            :label="loading ? 'Processing…' : (isLogin ? 'Sign In' : 'Sign Up')"
          />
        </q-form>
      </q-card-section>



      <q-separator />

      <!-- Footer / Info -->
      <q-card-section class="text-center">
        <div class="text-caption text-grey-7">
          SSO integration with dendrotonics.com
        </div>

        <q-banner dense class="bg-green-1 text-green-10 rounded-borders q-mt-md">
          <template #avatar>
            <q-icon name="verified_user" />
          </template>

          <div class="text-caption">
            <div><span class="text-weight-bold">Default Admin Account:</span></div>
            <div class="q-mt-xs">Email: <span class="text-weight-bold">test</span></div>
            <div>Password: <span class="text-weight-bold">test</span></div>
          </div>
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { supabase } from '../boot/supabase'

/**
 * Keep your existing "callback prop" contract:
 * <LoginPage :onAuthSuccess="(token) => ..."/>
 */


const router = useRouter()
type ApiErrorPayload = { error?: string }

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')


function normalizeEmail(v: string) {
  return v.trim().toLowerCase()
}

function safeErrorMessage(err: unknown, fallback = 'Authentication failed') {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  return fallback
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}


async function handleSubmit() {
  error.value = ''
  loading.value = true

  // Normalize input early
  const emailNorm = normalizeEmail(email.value)
  const passwordVal = password.value
  const nameVal = name.value.trim()

  try {
    if (isLogin.value) {
      // ✅ Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password: passwordVal,
      })
      if (signInError) throw signInError

      // ✅ Prefer relying on Supabase session persistence, NOT localStorage tokens
      // Optional stronger assurance:
      // await verifyUserServerSide()

      // Redirect after login (avoid callback props in routed pages)
      // If you use ?redirect=... later, you can read route.query.redirect safely here.
      await router.push('/dashboard')
      return
    }

    // ✅ Signup via Edge Function (hardened request)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const publicKey =
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string)

    if (!supabaseUrl || !publicKey) {
      // Keep this message generic in production
      throw new Error('Configuration error. Please contact support.')
    }

    // Abortable request timeout (defensive reliability)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)


    function getProjectIdFromUrl (supabaseUrl: string) {
      // expected format: https://<projectId>.supabase.co
      return supabaseUrl
        .replace('https://', '')
        .replace('http://', '')
        .replace('.supabase.co', '')
        .replace(/\/+$/, '')
    }

    const projectId = getProjectIdFromUrl(supabaseUrl)

    const signupRes = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-1630e303/signup`,
      {
        method: 'POST',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicKey}`,
        },
        body: JSON.stringify({
          email: emailNorm,
          password: passwordVal,
          name: nameVal,
        }),
      }
    ).finally(() => window.clearTimeout(timeout))

    if (!signupRes.ok) {
      const payload = (await safeJson<ApiErrorPayload>(signupRes)) ?? {}
      // Avoid overly specific messages that help account enumeration.
      // Still provide user-helpful UI text.
      if (signupRes.status === 409) {
        throw new Error(payload.error || 'This email is already registered. Please sign in instead.')
      }
      throw new Error(payload.error || 'Signup failed. Please try again.')
    }

    // ✅ Auto-login after signup
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password: passwordVal,
    })
    if (signInError) throw signInError

    // Optional stronger assurance:
    // await verifyUserServerSide()

    await router.push('/dashboard')
  } catch (err) {
    // Hardened error handling: user-friendly but not overly revealing
    const msg = safeErrorMessage(err)

    const low = msg.toLowerCase()
    if (
      low.includes('already registered') ||
      low.includes('email exists') ||
      low.includes('already been registered')
    ) {
      error.value = msg + ' Please use the Sign In form below.'
    } else if (err instanceof DOMException && err.name === 'AbortError') {
      error.value = 'Network timeout. Please try again.'
    } else {
      // Keep message reasonably generic; avoid leaking internal details
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}

</script>
