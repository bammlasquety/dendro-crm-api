<template>
  <q-card flat bordered class="column full-height">
    <!-- Header -->
    <q-card-section class="row items-center justify-between q-pb-sm">
      <div class="text-h6">Customer Leads</div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="refreshable"
          flat dense
          icon="refresh"
          :loading="refreshing"
          @click="emitRefresh"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>

        <q-btn
          v-if="importable"
          flat dense
          icon="upload"
          @click="emitImport"
        >
          <q-tooltip>Import</q-tooltip>
        </q-btn>

        <q-btn
          color="positive"
          icon="add"
          label="Add Contact"
          unelevated
          @click="emitAdd"
        />
      </div>
    </q-card-section>

    <q-separator />

    <!-- Filters -->
    <q-card-section class="row q-col-gutter-sm items-center">
      <q-input
        v-model="searchTerm"
        dense outlined
        debounce="250"
        placeholder="Search name, email, company, farm location…"
        class="col-12 col-md-5"
        clearable
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-select
        v-model="filterActive"
        dense outlined
        class="col-6 col-md-2"
        label="Active"
        :options="activeOptions"
        emit-value
        map-options
      />

      <q-select
        v-model="filterRegion"
        dense outlined
        class="col-6 col-md-3"
        label="Region"
        :options="regionOptions"
        emit-value
        map-options
      />

      <q-select
        v-model="filterLead"
        dense outlined
        class="col-12 col-md-2"
        label="Lead Status"
        :options="leadOptions"
        emit-value
        map-options
      />
    </q-card-section>

    <q-separator />

    <!-- Table -->
    <q-table
      class="flex-1"
      flat
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      dense
      :loading="loading"
      :visible-columns="visibleColumns"
      :rows-per-page-options="[10, 25, 50, 100]"
      @row-click="(_evt, row) => emitSelect(row)"
    >
      <!-- Name -->
      <template #body-cell-name="p">
        <q-td :props="p">
          <div class="text-weight-medium">{{ p.row.name }}</div>
          <div v-if="p.row.jobTitle" class="text-caption text-grey-7">
            {{ p.row.jobTitle }}
          </div>
        </q-td>
      </template>

      <!-- Company -->
      <template #body-cell-companyName="p">
        <q-td :props="p">
          <div v-if="p.row.companyName" class="row items-center no-wrap">
            <q-icon name="business" color="positive" size="16px" class="q-mr-xs" />
            <div class="ellipsis" style="max-width: 180px">{{ p.row.companyName }}</div>
          </div>
          <span v-else class="text-caption text-grey-6">—</span>
        </q-td>
      </template>

      <!-- Email -->
      <template #body-cell-email="p">
        <q-td :props="p">
          <div class="row items-center no-wrap">
            <q-icon name="mail" size="16px" class="q-mr-xs text-grey-7" />
            <div class="ellipsis" style="max-width: 220px">{{ p.row.email }}</div>
          </div>
        </q-td>
      </template>

      <!-- Contact number -->
      <template #body-cell-contactNumber="p">
        <q-td :props="p">
          <div v-if="p.row.contactNumber" class="row items-center no-wrap">
            <q-icon name="call" size="16px" class="q-mr-xs text-grey-7" />
            <div>{{ p.row.contactNumber }}</div>
          </div>
          <span v-else class="text-caption text-grey-6">—</span>
        </q-td>
      </template>

      <!-- Farm location -->
      <template #body-cell-farmLocation="p">
        <q-td :props="p">
          <div v-if="p.row.farmLocation" class="row items-center no-wrap">
            <q-icon name="place" size="16px" class="q-mr-xs text-grey-7" />
            <div class="ellipsis" style="max-width: 240px">{{ p.row.farmLocation }}</div>
          </div>
          <span v-else class="text-caption text-grey-6">—</span>
        </q-td>
      </template>

      <!-- Region -->
      <template #body-cell-region="p">
        <q-td :props="p">
          <q-badge v-if="p.row.region" color="grey-3" text-color="grey-9">
            {{ p.row.region }}
          </q-badge>
          <span v-else class="text-caption text-grey-6">—</span>
        </q-td>
      </template>

      <!-- Status (Active/Inactive) -->
      <template #body-cell-status="p">
        <q-td :props="p">
          <div class="row items-center no-wrap">
            <q-icon
              :name="p.row.status === 'active' ? 'check_circle' : 'cancel'"
              :color="p.row.status === 'active' ? 'positive' : 'negative'"
              size="18px"
              class="q-mr-xs"
            />
            <span class="text-capitalize">{{ p.row.status }}</span>
          </div>
        </q-td>
      </template>

      <!-- Lead Status (pipeline stage) -->
      <template #body-cell-leadStatus="p">
        <q-td :props="p">
          <q-badge :color="leadStatusColor(p.row.leadStatus)">
            {{ prettyLeadStatus(p.row.leadStatus) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Webinar Opt-in -->
      <template #body-cell-webinarOptIn="p">
        <q-td :props="p" class="text-center">
          <q-icon
            :name="p.row.webinarOptIn ? 'check_circle' : 'radio_button_unchecked'"
            :color="p.row.webinarOptIn ? 'positive' : 'grey-6'"
          />
        </q-td>
      </template>

      <!-- Webinar Attended -->
      <template #body-cell-webinarAttended="p">
        <q-td :props="p" class="text-center">
          <q-icon
            :name="p.row.webinarAttended ? 'check_circle' : 'radio_button_unchecked'"
            :color="p.row.webinarAttended ? 'positive' : 'grey-6'"
          />
        </q-td>
      </template>

      <!-- Newsletter Opt-in -->
      <template #body-cell-newsletterOptIn="p">
        <q-td :props="p" class="text-center">
          <q-icon
            :name="p.row.newsletterOptIn ? 'check_circle' : 'radio_button_unchecked'"
            :color="p.row.newsletterOptIn ? 'positive' : 'grey-6'"
          />
        </q-td>
      </template>

      <!-- Label -->
      <template #body-cell-label="p">
        <q-td :props="p">
          <q-badge
            v-if="p.row.label"
            :color="labelColor(p.row.label)"
            class="text-capitalize"
          >
            {{ p.row.label }}
          </q-badge>
          <span v-else class="text-caption text-grey-6">—</span>
        </q-td>
      </template>

      <!-- Active/Inactive toggle (updates status only) -->
      <template #body-cell-activeToggle="p">
        <q-td :props="p" class="text-center">
          <q-toggle
            :model-value="p.row.status === 'active'"
            color="positive"
            @update:model-value="val => emitStatusUpdate(p.row.id, val ? 'active' : 'inactive')"
          />
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="p">
        <q-td :props="p" align="right">
          <q-btn dense flat icon="edit" @click.stop="emitSelect(p.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>

          <q-btn dense flat icon="delete" color="negative" @click.stop="confirmDelete(p.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width text-center q-pa-xl text-grey-7">
          No contacts found
        </div>
      </template>
    </q-table>

    <q-separator />

    <q-card-section class="text-caption text-grey-7">
      Showing {{ filteredRows.length }} of {{ rows.length }} contacts
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface ContactRow {
  id: string
  name: string
  companyName?: string
  email: string
  contactNumber?: string
  farmLocation?: string
  region?: string

  // Active/Inactive state
  status: 'active' | 'inactive'

  // Pipeline stage
  leadStatus: LeadStatus

  webinarOptIn: boolean
  webinarAttended: boolean
  newsletterOptIn: boolean

  label?: string
  jobTitle?: string
}

const props = withDefaults(defineProps<{
  contacts?: ContactRow[]
  loading?: boolean
  refreshable?: boolean
  importable?: boolean
  refreshing?: boolean
}>(), {
  contacts: () => [],
  loading: false,
  refreshable: false,
  importable: false,
  refreshing: false
})

const emit = defineEmits<{
  (e: 'select', contact: ContactRow): void
  (e: 'add'): void
  (e: 'delete', id: string): void
  (e: 'refresh'): void
  (e: 'import'): void
  (e: 'update-status', payload: { id: string; status: 'active' | 'inactive' }): void
}>()

const $q = useQuasar()

const searchTerm = ref('')
const filterActive = ref<'all' | 'active' | 'inactive'>('all')
const filterRegion = ref('all')
const filterLead = ref<'all' | LeadStatus>('all')

const rows = computed(() => props.contacts)

const activeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const leadOptions = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Closed Won', value: 'closed_won' },
  { label: 'Closed Lost', value: 'closed_lost' }
]

const regionOptions = computed(() => {
  const regions = Array.from(new Set(rows.value.map(r => r.region).filter(Boolean))) as string[]
  return [{ label: 'All', value: 'all' }, ...regions.map(r => ({ label: r, value: r }))]
})

const filteredRows = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return rows.value.filter(r => {
    const matchesSearch =
      !term ||
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.companyName?.toLowerCase().includes(term) ?? false) ||
      (r.jobTitle?.toLowerCase().includes(term) ?? false) ||
      (r.farmLocation?.toLowerCase().includes(term) ?? false)

    const matchesActive = filterActive.value === 'all' || r.status === filterActive.value
    const matchesRegion = filterRegion.value === 'all' || r.region === filterRegion.value
    const matchesLead = filterLead.value === 'all' || r.leadStatus === filterLead.value

    return matchesSearch && matchesActive && matchesRegion && matchesLead
  })
})



  const columns: QTableColumn<ContactRow>[] = [
    { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
    { name: 'companyName', label: 'Company', field: 'companyName', sortable: true, align: 'left' },
    { name: 'email', label: 'Contact email', field: 'email', sortable: true, align: 'left' },
    { name: 'contactNumber', label: 'Contact number', field: 'contactNumber', align: 'left' },
    { name: 'farmLocation', label: 'Farm Location', field: 'farmLocation', align: 'left' },
    { name: 'region', label: 'Region', field: 'region', sortable: true, align: 'left' },
    { name: 'status', label: 'Status', field: 'status', sortable: true, align: 'left' },
    { name: 'leadStatus', label: 'Lead Status', field: 'leadStatus', sortable: true, align: 'left' },
    { name: 'webinarOptIn', label: 'Webinar Opt-in', field: 'webinarOptIn', align: 'center' },
    { name: 'webinarAttended', label: 'Webinar Attended', field: 'webinarAttended', align: 'center' },
    { name: 'newsletterOptIn', label: 'Newsletter Opt-in', field: 'newsletterOptIn', align: 'center' },
    { name: 'label', label: 'Label', field: 'label', align: 'left' },
    { name: 'activeToggle', label: 'Active/Inactive', field: 'status', align: 'center' },
    { name: 'actions', label: 'Actions', field: () => null, align: 'right' }
  ]

const visibleColumns = computed(() => {
  // Keep it readable on small screens
  if ($q.screen.lt.md) return ['name', 'status', 'actions']
  if ($q.screen.lt.lg) return ['name', 'companyName', 'email', 'status', 'leadStatus', 'actions']
  return columns.map(c => c.name)
})

function emitSelect (row: ContactRow) {
  emit('select', row)
}
function emitAdd () {
  emit('add')
}
function emitRefresh () {
  emit('refresh')
}
function emitImport () {
  emit('import')
}
function emitStatusUpdate (id: string, status: 'active' | 'inactive') {
  emit('update-status', { id, status })
}

function confirmDelete (row: ContactRow) {
  $q.dialog({
    title: 'Delete Contact',
    message: `Delete ${row.name}?`,
    cancel: true,
    persistent: true
  }).onOk(() => emit('delete', row.id))
}

function prettyLeadStatus (s: LeadStatus) {
  return s.replace('_', ' ')
}
function leadStatusColor (s: LeadStatus) {
  switch (s) {
    case 'new': return 'grey-6'
    case 'qualified': return 'primary'
    case 'contacted': return 'teal'
    case 'proposal': return 'indigo'
    case 'negotiation': return 'orange'
    case 'closed_won': return 'positive'
    case 'closed_lost': return 'negative'
    default: return 'grey-6'
  }
}
function labelColor (label: string) {
  const l = label.toLowerCase()
  if (l.includes('hot')) return 'red'
  if (l.includes('warm')) return 'orange'
  if (l.includes('cold')) return 'blue'
  return 'grey'
}
</script>
