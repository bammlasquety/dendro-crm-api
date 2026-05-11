<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          DENDROTONICS CRM
        </q-toolbar-title>

        <div>
          <q-btn
            dense
            round
            flat
            icon="exit_to_app"
            color="white"
            @click="logout"
          >
            <q-tooltip>Logout</q-tooltip>
          </q-btn>
          </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Menu Options
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../boot/supabase';
import { useQuasar } from 'quasar';

import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';


const router = useRouter()
const $q = useQuasar()

async function logout () {
  const { error } = await supabase.auth.signOut()

  if (error) {
    $q.notify({
      type: 'negative',
      message: 'Logout failed. Please try again.',
    })
    return
  }

  // Optional: clear any app‑level UI state here (Pinia, refs, etc.)

  // Replace history so back‑button can’t return to protected pages
  await router.replace('/login')
}


const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    caption: 'Manage customer leads and interactions',
    icon: 'dashboard',
    link: '/dashboard'
  },
  {
    title: 'Customers',
    caption: 'Manage customer information and interactions',
    icon: 'contacts',
    link: '/customers'
  },
  {
    title: 'Companies',
    caption: 'Monitor and manage company profiles',
    icon: 'business',
    link: '/companies'
  },
  {
    title: 'Campaigns',
    caption: 'Launch and track marketing campaigns',
    icon: 'campaign',
    link: '/campaigns'
  },
  {
    title: 'Pipeline',
    caption: 'Manage sales funnels',
    icon: 'view_kanban',
    link: '/pipeline'
  },
  {
    title: 'Facebook',
    caption: '@dendrotonics',
    icon: 'public',
    link: 'https://www.facebook.com/dendrotonics'
  },
  {
    title: 'YouTube',
    caption: 'Community Feedback',
    icon: 'favorite',
    link: 'https://www.youtube.com/@ephraimcercado'
  }
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
