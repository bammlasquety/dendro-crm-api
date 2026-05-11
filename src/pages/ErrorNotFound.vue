<template>
  <q-page class="flex flex-center q-pa-lg">
    <q-card class="q-pa-lg text-center" style="max-width: 420px; width: 100%;">
      <q-icon
        name="error_outline"
        color="positive"
        size="64px"
        class="q-mb-md"
      />

      <div class="text-h5 text-weight-bold q-mb-sm">
        Page Not Found
      </div>

      <div class="text-grey-7 q-mb-lg">
        The page you’re looking for doesn’t exist or may have been moved.
      </div>

      <q-btn
        color="primary"
        label="Back to Dashboard"
        icon="dashboard"
        @click="goHome"
        unelevated
        class="full-width"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()


async function goHome () {
  await router.replace('/dashboard')
}

</script>
