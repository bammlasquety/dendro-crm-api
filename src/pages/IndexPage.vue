<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">Dashboard</div>
      <div class="text-grey-7 q-mt-sm">
        Manage your agriforestry customer relationships
      </div>
    </div>

    <!-- Stats -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="col-12 col-md-6 col-lg-3"
      >
        <q-card class="q-pa-md">
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-grey-6">{{ stat.label }}</div>
              <div class="text-h4 q-mt-xs">{{ stat.value }}</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ stat.subtext }}
              </div>
            </div>

            <q-avatar
              size="48px"
              :color="stat.color"
              text-color="white"
            >
              <q-icon :name="stat.icon" />
            </q-avatar>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Charts / Lists -->
    <div class="row q-col-gutter-lg">
      <!-- Lead Status -->
      <div class="col-12 col-lg-6">
        <q-card class="q-pa-lg full-height">
          <div class="text-h6 q-mb-md">Lead Status Distribution</div>

          <div v-if="validContacts.length === 0" class="text-grey-6">
            No contacts available
          </div>

          <div
            v-for="(count, status) in leadStatusCounts"
            :key="status"
            class="q-mb-md"
          >
            <div class="row items-center q-mb-xs">
              <div class="col text-capitalize">
                {{ formatStatus(status) }}
              </div>
              <div class="text-caption text-grey-7">
                {{ count }}
              </div>
            </div>

            <q-linear-progress
              :value="count / validContacts.length"
              color="primary"
              rounded
            />
          </div>
        </q-card>
      </div>

      <!-- Recent Campaigns -->
      <div class="col-12 col-lg-6">
        <q-card class="q-pa-lg full-height">
          <div class="text-h6 q-mb-md">Recent Campaigns</div>

          <div
            v-if="campaigns.length === 0"
            class="text-grey-6 text-center q-pa-lg"
          >
            No campaigns yet
          </div>

          <q-list v-else>
            <q-item
              v-for="campaign in campaigns.slice(0, 5)"
              :key="campaign.id"
              class="q-my-xs"
              bordered
            >
              <q-item-section>
                <q-item-label>{{ campaign.name }}</q-item-label>
                <q-item-label caption class="text-capitalize">
                  {{ campaign.type }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="statusColor(campaign.status)"
                  align="middle"
                  class="text-capitalize"
                >
                  {{ campaign.status }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props
 */

const props = withDefaults(
  defineProps<{
    contacts?: Contact[]
    campaigns?: Campaign[]
  }>(),
  {
    contacts: () => [],
    campaigns: () => [],
  }
)


/**
 * Types (same semantics as your TSX version)
 */
interface Contact {
  id: string
  status?: 'active' | 'inactive'
  leadStatus?: string
  interestedInWebinar?: boolean
  attendedWebinar?: boolean
  dateCreated?: string
}

interface Campaign {
  id: string
  name: string
  type: string
  status: 'draft' | 'scheduled' | 'sent'
}

/**
 * Derived data (same logic as TSX)
 */
const validContacts = computed(() =>
  props.contacts.filter(c => c != null)
)

const activeContacts = computed(() =>
  validContacts.value.filter(c => c.status === 'active').length
)

const interestedInWebinar = computed(() =>
  validContacts.value.filter(c => c.interestedInWebinar).length
)

const attendedWebinar = computed(() =>
  validContacts.value.filter(c => c.attendedWebinar).length
)

const activeCampaigns = computed(() =>
  props.campaigns.filter(c => c.status !== 'sent').length
)

const recentContacts = computed(() => {
  const last30 = new Date()
  last30.setDate(last30.getDate() - 30)

  return validContacts.value.filter(
    c => c.dateCreated && new Date(c.dateCreated) > last30
  ).length
})

const leadStatusCounts = computed<Record<string, number>>(() => {
  return validContacts.value.reduce((acc, c) => {
    if (c.leadStatus) {
      acc[c.leadStatus] = (acc[c.leadStatus] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
})

/**
 * Stat cards
 */
const stats = computed(() => [
  {
    label: 'Total Contacts',
    value: validContacts.value.length,
    subtext: `${activeContacts.value} active`,
    icon: 'group',
    color: 'primary',
  },
  {
    label: 'Active Campaigns',
    value: activeCampaigns.value,
    subtext: `${props.campaigns.filter(c => c.status === 'sent').length} sent`,
    icon: 'mail',
    color: 'positive',
  },
  {
    label: 'Webinar Interest',
    value: interestedInWebinar.value,
    subtext: `${attendedWebinar.value} attended`,
    icon: 'event',
    color: 'purple',
  },
  {
    label: 'New (30 days)',
    value: recentContacts.value,
    subtext: 'Recent contacts',
    icon: 'trending_up',
    color: 'orange',
  },
])

/**
 * Helpers
 */
function formatStatus (status: string) {
  return status.replace('-', ' ')
}

function statusColor (status: Campaign['status']) {
  if (status === 'sent') return 'positive'
  if (status === 'scheduled') return 'primary'
  return 'grey'
}
</script>
