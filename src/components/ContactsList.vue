<template>
  <div class="leads-page column no-wrap full-height">

    <!-- ── Page Header ──────────────────────────────────────────────────── -->
    <div class="leads-header q-px-lg q-pt-lg q-pb-md">
      <div class="row items-start justify-between no-wrap">
        <div>
          <div class="text-h5 text-weight-bold text-grey-9 lh-tight">Customer Leads</div>
          <div class="text-caption text-grey-6 q-mt-xs">Manage and track your sales pipeline</div>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-btn v-if="refreshable" flat round dense icon="refresh" color="grey-7" :loading="refreshing" @click="emitRefresh">
            <q-tooltip>Refresh data</q-tooltip>
          </q-btn>
          <q-btn v-if="importable" flat round dense icon="upload_file" color="grey-7" @click="emitImport">
            <q-tooltip>Import CSV</q-tooltip>
          </q-btn>
          <q-btn unelevated color="teal" icon="person_add" label="Add Lead" class="q-ml-xs" @click="emitAdd" />
        </div>
      </div>

      <!-- KPI strip -->
      <div class="row q-gutter-sm q-mt-md">
        <q-chip
          v-for="kpi in kpiChips" :key="kpi.key"
          :color="kpi.active ? kpi.activeColor : 'grey-2'"
          :text-color="kpi.active ? 'white' : 'grey-8'"
          dense clickable class="kpi-chip"
          @click="kpi.onClick()"
        >
          <span class="kpi-value">{{ kpi.value }}</span>
          <span class="kpi-label q-ml-xs">{{ kpi.label }}</span>
        </q-chip>
      </div>
    </div>

    <!-- ── Filter Bar ───────────────────────────────────────────────────── -->
    <div class="filter-bar q-px-lg q-py-sm">
      <!-- Row 1: Search + primary dropdowns -->
      <div class="row q-col-gutter-sm items-center q-mb-sm">
        <div class="col-12 col-sm-5 col-md-4">
          <q-input v-model="searchTerm" outlined dense debounce="200" placeholder="Search by name, email, company…" bg-color="white" clearable>
            <template #prepend><q-icon name="search" color="grey-5" size="18px" /></template>
          </q-input>
        </div>
        <div class="col-6 col-sm-3 col-md-2">
          <q-select v-model="filterActive" outlined dense label="Status" :options="activeOptions" emit-value map-options bg-color="white" :class="{ 'filter-active': filterActive !== 'all' }" />
        </div>
        <div class="col-6 col-sm-4 col-md-3">
          <q-select v-model="filterLead" outlined dense label="Lead Stage" :options="leadOptions" emit-value map-options bg-color="white" :class="{ 'filter-active': filterLead !== 'all' }">
            <template v-if="filterLead !== 'all'" #prepend>
              <q-icon name="circle" :color="stageColor(filterLead)" size="10px" />
            </template>
          </q-select>
        </div>
        <div class="col-6 col-sm-3 col-md-3">
          <q-select v-model="filterRegion" outlined dense label="Region" :options="regionOptions" emit-value map-options bg-color="white" :class="{ 'filter-active': filterRegion !== 'all' }" />
        </div>
      </div>

      <!-- Row 2: Secondary filters + sort + clear -->
      <div class="row q-col-gutter-sm items-center">
        <div class="col-6 col-sm-3 col-md-2">
          <q-select v-model="filterWebinar" outlined dense label="Webinar" :options="webinarOptions" emit-value map-options bg-color="white" :class="{ 'filter-active': filterWebinar !== 'all' }" />
        </div>
        <div class="col-6 col-sm-3 col-md-2">
          <q-input v-model="filterDateFrom" outlined dense type="date" label="Created from" stack-label bg-color="white" clearable :class="{ 'filter-active': filterDateFrom !== '' }" />
        </div>
        <div class="col-6 col-sm-3 col-md-2">
          <q-input v-model="filterDateTo" outlined dense type="date" label="Created to" stack-label bg-color="white" clearable :class="{ 'filter-active': filterDateTo !== '' }" />
        </div>
        <div class="col-6 col-sm-3 col-md-2">
          <q-btn-toggle
            v-model="sortOrder" spread dense unelevated toggle-color="teal" color="white" text-color="grey-7"
            class="sort-toggle full-width"
            :options="[{ label: 'Newest', value: 'desc', icon: 'arrow_downward' }, { label: 'Oldest', value: 'asc', icon: 'arrow_upward' }]"
          />
        </div>
        <div class="col-12 col-md-4 row items-center justify-end q-gutter-xs">
          <transition name="fade">
            <q-btn v-if="hasActiveFilters" flat dense no-caps color="teal" icon="filter_alt_off" label="Clear filters" size="sm" @click="clearFilters" />
          </transition>
          <div class="result-count text-caption text-grey-6">
            <template v-if="hasActiveFilters"><strong class="text-grey-9">{{ filteredRows.length }}</strong> of {{ rows.length }}</template>
            <template v-else><strong class="text-grey-9">{{ rows.length }}</strong> leads</template>
          </div>
        </div>
      </div>

      <!-- Active filter chips -->
      <div v-if="activeFilterChips.length" class="row q-gutter-xs q-mt-sm">
        <q-chip
          v-for="chip in activeFilterChips" :key="chip.key"
          dense removable color="teal-1" text-color="teal-9" size="sm" class="filter-chip"
          @remove="chip.clear()"
        >
          <q-icon :name="chip.icon" size="12px" class="q-mr-xs" />{{ chip.label }}
        </q-chip>
      </div>
    </div>

    <q-separator />

    <!-- ── Table ────────────────────────────────────────────────────────── -->
    <q-table
      class="leads-table col"
      flat
      virtual-scroll
      :virtual-scroll-item-size="52"
      :rows-per-page-options="[0]"
      hide-pagination
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :visible-columns="visibleColumns"
      @row-click="onRowClick"
    >
      <template #loading>
        <q-inner-loading showing color="teal" />
      </template>

      <!-- Name -->
      <template #body-cell-name="p">
        <q-td :props="p" class="name-cell">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar size="32px" :color="avatarColor(p.row.name)" text-color="white" class="avatar-sm">
              <span class="text-caption text-weight-bold">{{ initials(p.row.name) }}</span>
            </q-avatar>
            <div class="col-grow" style="min-width:0">
              <div class="text-body2 text-weight-medium text-grey-9 ellipsis">{{ p.row.name }}</div>
              <div v-if="p.row.jobTitle" class="text-caption text-grey-6 ellipsis">{{ p.row.jobTitle }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Company -->
      <template #body-cell-companyName="p">
        <q-td :props="p">
          <div v-if="p.row.companyName" class="row items-center no-wrap">
            <q-icon name="business" size="14px" color="grey-5" class="q-mr-xs flex-shrink-0" />
            <span class="ellipsis text-body2" style="max-width:160px">{{ p.row.companyName }}</span>
          </div>
          <span v-else class="text-grey-4">—</span>
        </q-td>
      </template>

      <!-- Email -->
      <template #body-cell-email="p">
        <q-td :props="p">
          <a :href="`mailto:${p.row.email}`" class="email-link ellipsis" style="max-width:200px" @click.stop>{{ p.row.email }}</a>
        </q-td>
      </template>

      <!-- Region -->
      <template #body-cell-region="p">
        <q-td :props="p">
          <span v-if="p.row.region" class="region-tag">{{ p.row.region }}</span>
          <span v-else class="text-grey-4">—</span>
        </q-td>
      </template>

      <!-- Lead Status -->
      <template #body-cell-leadStatus="p">
        <q-td :props="p">
          <span :class="['lead-chip', `lead-chip--${p.row.leadStatus}`]">{{ prettyLeadStatus(p.row.leadStatus) }}</span>
        </q-td>
      </template>

      <!-- Webinar -->
      <template #body-cell-webinarAttended="p">
        <q-td :props="p" class="text-center">
          <span :class="p.row.webinarAttended ? 'bool-yes' : 'bool-no'">{{ p.row.webinarAttended ? 'Yes' : 'No' }}</span>
        </q-td>
      </template>

      <!-- Newsletter -->
      <template #body-cell-newsletterOptIn="p">
        <q-td :props="p" class="text-center">
          <span :class="p.row.newsletterOptIn ? 'bool-yes' : 'bool-no'">{{ p.row.newsletterOptIn ? 'Yes' : 'No' }}</span>
        </q-td>
      </template>

      <!-- Label -->
      <template #body-cell-label="p">
        <q-td :props="p">
          <span v-if="p.row.label" :class="['label-tag', `label-tag--${labelKey(p.row.label)}`]">{{ p.row.label }}</span>
          <span v-else class="text-grey-4">—</span>
        </q-td>
      </template>

      <!-- Created -->
      <template #body-cell-createdAt="p">
        <q-td :props="p">
          <span class="text-caption text-grey-6" :title="p.row.createdAt">{{ formatDate(p.row.createdAt) }}</span>
        </q-td>
      </template>

      <!-- Active toggle -->
      <template #body-cell-activeToggle="p">
        <q-td :props="p" class="text-center">
          <q-toggle
            :model-value="p.row.status === 'active'"
            color="positive" size="sm"
            @update:model-value="val => emitStatusUpdate(p.row.id, val ? 'active' : 'inactive')"
            @click.stop
          />
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="p">
        <q-td :props="p" class="text-right">
          <q-btn flat round dense icon="edit" color="grey-6" size="sm" @click.stop="emitSelect(p.row)">
            <q-tooltip :delay="600">Edit contact</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="delete_outline" color="grey-5" size="sm" class="q-ml-xs" @click.stop="confirmDelete(p.row)">
            <q-tooltip :delay="600">Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="column items-center justify-center q-pa-xl full-width" style="gap:12px">
          <q-icon :name="hasActiveFilters ? 'filter_alt_off' : 'people_outline'" size="56px" color="grey-4" />
          <div class="text-subtitle2 text-grey-6">{{ hasActiveFilters ? 'No leads match your filters' : 'No leads yet' }}</div>
          <div class="text-caption text-grey-5">{{ hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'Add your first lead to get started.' }}</div>
          <q-btn v-if="hasActiveFilters" unelevated color="teal" no-caps label="Clear filters" size="sm" @click="clearFilters" />
        </div>
      </template>
    </q-table>

    <!-- ── Footer ───────────────────────────────────────────────────────── -->
    <div class="status-bar row items-center justify-between q-px-lg q-py-xs">
      <span class="text-caption text-grey-6">
        <template v-if="loading">Loading leads…</template>
        <template v-else-if="hasActiveFilters">
          Showing <strong>{{ filteredRows.length }}</strong> of <strong>{{ rows.length }}</strong> leads
          <span class="q-ml-xs text-teal-7">· Filters active</span>
        </template>
        <template v-else><strong>{{ rows.length }}</strong> total leads</template>
      </span>
      <span class="text-caption text-grey-5">Last updated: {{ lastUpdated }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import type { ContactRow, LeadStatus } from '../types/contacts'

export type { ContactRow, LeadStatus }

// ─── Props & Emits ────────────────────────────────────────────────────────────

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
  refreshing: false,
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

// ─── Last-updated ─────────────────────────────────────────────────────────────

const lastUpdated = computed(() =>
  props.loading ? '—' : new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
)

// ─── Filter state ─────────────────────────────────────────────────────────────

const searchTerm     = ref('')
const filterActive   = ref<'all' | 'active' | 'inactive'>('all')
const filterLead     = ref<'all' | LeadStatus>('all')
const filterWebinar  = ref<'all' | 'yes' | 'no'>('all')
const filterRegion   = ref('all')
const filterDateFrom = ref('')
const filterDateTo   = ref('')
const sortOrder      = ref<'desc' | 'asc'>('desc')

// ─── Filter options ───────────────────────────────────────────────────────────

const activeOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active',       value: 'active' },
  { label: 'Inactive',     value: 'inactive' },
]

const leadOptions = [
  { label: 'All stages',   value: 'all' },
  { label: 'New',          value: 'new' },
  { label: 'Qualified',    value: 'qualified' },
  { label: 'Contacted',    value: 'contacted' },
  { label: 'Proposal',     value: 'proposal' },
  { label: 'Negotiation',  value: 'negotiation' },
  { label: 'Closed Won',   value: 'closed_won' },
  { label: 'Closed Lost',  value: 'closed_lost' },
  { label: 'Partner',      value: 'partner' },
]

const webinarOptions = [
  { label: 'All',      value: 'all' },
  { label: 'Attended', value: 'yes' },
  { label: 'Not yet',  value: 'no' },
]

const regionOptions = computed(() => {
  const regions = Array.from(new Set(props.contacts.map(r => r.region).filter(Boolean))) as string[]
  return [{ label: 'All regions', value: 'all' }, ...regions.sort().map(r => ({ label: r, value: r }))]
})

// ─── KPI chips ────────────────────────────────────────────────────────────────

const kpiChips = computed(() => {
  const all      = props.contacts
  const active   = all.filter(r => r.status === 'active').length
  const newLeads = all.filter(r => r.leadStatus === 'new').length
  const attended = all.filter(r => r.webinarAttended).length
  return [
    { key: 'total',   label: 'Total',            value: all.length, activeColor: 'grey-7',   active: !hasActiveFilters.value,           onClick: () => clearFilters() },
    { key: 'active',  label: 'Active',            value: active,     activeColor: 'positive', active: filterActive.value === 'active',   onClick: () => { filterActive.value  = filterActive.value  === 'active' ? 'all' : 'active' } },
    { key: 'new',     label: 'New leads',         value: newLeads,   activeColor: 'primary',  active: filterLead.value   === 'new',      onClick: () => { filterLead.value    = filterLead.value    === 'new'    ? 'all' : 'new' } },
    { key: 'webinar', label: 'Attended webinar',  value: attended,   activeColor: 'teal',     active: filterWebinar.value === 'yes',     onClick: () => { filterWebinar.value = filterWebinar.value === 'yes'   ? 'all' : 'yes' } },
  ]
})

// ─── Active filter chips ──────────────────────────────────────────────────────

const activeFilterChips = computed(() => {
  const chips: { key: string; label: string; icon: string; clear: () => void }[] = []
  if (searchTerm.value.trim())
    chips.push({ key: 'search', label: `"${searchTerm.value.trim()}"`, icon: 'search', clear: () => { searchTerm.value = '' } })
  if (filterActive.value !== 'all')
    chips.push({ key: 'status', label: filterActive.value, icon: 'circle', clear: () => { filterActive.value = 'all' } })
  if (filterLead.value !== 'all') {
    const stage = filterLead.value
    chips.push({ key: 'lead', label: prettyLeadStatus(stage), icon: 'trending_up', clear: () => { filterLead.value = 'all' } })
  }
  if (filterWebinar.value !== 'all')
    chips.push({ key: 'webinar', label: filterWebinar.value === 'yes' ? 'Webinar attended' : 'Not attended', icon: 'groups', clear: () => { filterWebinar.value = 'all' } })
  if (filterRegion.value !== 'all')
    chips.push({ key: 'region', label: filterRegion.value, icon: 'place', clear: () => { filterRegion.value = 'all' } })
  if (filterDateFrom.value)
    chips.push({ key: 'from', label: `From ${formatDate(filterDateFrom.value)}`, icon: 'calendar_today', clear: () => { filterDateFrom.value = '' } })
  if (filterDateTo.value)
    chips.push({ key: 'to', label: `To ${formatDate(filterDateTo.value)}`, icon: 'calendar_today', clear: () => { filterDateTo.value = '' } })
  return chips
})

// ─── Derived rows ─────────────────────────────────────────────────────────────

const rows = computed(() => props.contacts)

const hasActiveFilters = computed(() =>
  searchTerm.value.trim() !== '' ||
  filterActive.value !== 'all' ||
  filterLead.value !== 'all' ||
  filterWebinar.value !== 'all' ||
  filterRegion.value !== 'all' ||
  filterDateFrom.value !== '' ||
  filterDateTo.value !== ''
)

const filteredRows = computed(() => {
  const term     = searchTerm.value.trim().toLowerCase()
  const dateFrom = filterDateFrom.value ? new Date(filterDateFrom.value).getTime() : null
  const dateTo   = filterDateTo.value ? new Date(filterDateTo.value + 'T23:59:59').getTime() : null

  const filtered = rows.value.filter(r => {
    if (term) {
      const hit = r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term) ||
        (r.companyName?.toLowerCase().includes(term) ?? false) ||
        (r.jobTitle?.toLowerCase().includes(term) ?? false) ||
        (r.farmLocation?.toLowerCase().includes(term) ?? false) ||
        (r.region?.toLowerCase().includes(term) ?? false)
      if (!hit) return false
    }
    if (filterActive.value !== 'all' && r.status !== filterActive.value) return false
    if (filterLead.value !== 'all' && r.leadStatus !== filterLead.value) return false
    if (filterRegion.value !== 'all' && r.region !== filterRegion.value) return false
    if (filterWebinar.value === 'yes' && !r.webinarAttended) return false
    if (filterWebinar.value === 'no' && r.webinarAttended) return false
    if (r.createdAt) {
      const ts = new Date(r.createdAt).getTime()
      if (dateFrom !== null && ts < dateFrom) return false
      if (dateTo   !== null && ts > dateTo)   return false
    }
    return true
  })

  return filtered.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return sortOrder.value === 'desc' ? tb - ta : ta - tb
  })
})

function clearFilters() {
  searchTerm.value = ''; filterActive.value = 'all'; filterLead.value = 'all'
  filterWebinar.value = 'all'; filterRegion.value = 'all'
  filterDateFrom.value = ''; filterDateTo.value = ''; sortOrder.value = 'desc'
}

// ─── Table columns ────────────────────────────────────────────────────────────

const columns: QTableColumn<ContactRow>[] = [
  { name: 'name',            label: 'Name',       field: 'name',            sortable: true,  align: 'left',   style: 'min-width:180px' },
  { name: 'companyName',     label: 'Company',    field: 'companyName',     sortable: true,  align: 'left',   style: 'min-width:140px' },
  { name: 'email',           label: 'Email',      field: 'email',           sortable: true,  align: 'left',   style: 'min-width:180px' },
  { name: 'region',          label: 'Region',     field: 'region',          sortable: true,  align: 'left',   style: 'min-width:100px' },
  { name: 'leadStatus',      label: 'Stage',      field: 'leadStatus',      sortable: true,  align: 'left',   style: 'min-width:120px' },
  { name: 'webinarAttended', label: 'Webinar',    field: 'webinarAttended', sortable: false, align: 'center', style: 'width:80px' },
  { name: 'newsletterOptIn', label: 'Newsletter', field: 'newsletterOptIn', sortable: false, align: 'center', style: 'width:90px' },
  { name: 'label',           label: 'Label',      field: 'label',           sortable: false, align: 'left',   style: 'min-width:80px' },
  { name: 'createdAt',       label: 'Created',    field: 'createdAt',       sortable: true,  align: 'left',   style: 'min-width:100px' },
  { name: 'activeToggle',    label: 'Active',     field: 'status',          sortable: false, align: 'center', style: 'width:70px' },
  { name: 'actions',         label: '',           field: () => '',          sortable: false, align: 'right',  style: 'width:80px' },
]

const visibleColumns = computed(() => {
  if ($q.screen.lt.md) return ['name', 'leadStatus', 'activeToggle', 'actions']
  if ($q.screen.lt.lg) return ['name', 'email', 'region', 'leadStatus', 'createdAt', 'activeToggle', 'actions']
  return columns.map(c => c.name)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? (parts[0]?.[0] ?? '?').toUpperCase()
    : ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

const AVATAR_COLORS = ['teal', 'indigo', 'deep-orange', 'purple', 'blue', 'brown', 'cyan-8', 'green-8']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'teal'
}

function prettyLeadStatus(s: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    new: 'New', qualified: 'Qualified', contacted: 'Contacted', proposal: 'Proposal',
    negotiation: 'Negotiation', closed_won: 'Closed Won', closed_lost: 'Closed Lost', partner: 'Partner',
  }
  return map[s] ?? s
}

// Accepts string so it can be called from templates without `as` assertions
function stageColor(s: string): string {
  const map: Record<string, string> = {
    new: 'blue-grey', qualified: 'primary', contacted: 'teal', proposal: 'indigo',
    negotiation: 'orange', closed_won: 'positive', closed_lost: 'negative', partner: 'purple',
  }
  return map[s] ?? 'grey'
}

function labelKey(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('hot'))  return 'hot'
  if (l.includes('warm')) return 'warm'
  if (l.includes('cold')) return 'cold'
  return 'default'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return `${diffDays}d ago`
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Emitters & handlers ──────────────────────────────────────────────────────

// Named handler avoids `row as ContactRow` type assertion in template
function onRowClick(_evt: Event, row: ContactRow) { emit('select', row) }

function emitSelect(row: ContactRow) { emit('select', row) }
function emitAdd()                   { emit('add') }
function emitRefresh()               { emit('refresh') }
function emitImport()                { emit('import') }
function emitStatusUpdate(id: string, status: 'active' | 'inactive') {
  emit('update-status', { id, status })
}

function confirmDelete(row: ContactRow) {
  $q.dialog({
    title: 'Delete Lead',
    message: `Permanently delete <strong>${row.name}</strong>? This cannot be undone.`,
    html: true,
    cancel: { flat: true, label: 'Cancel' },
    ok: { unelevated: true, color: 'negative', label: 'Delete' },
    persistent: true,
  }).onOk(() => emit('delete', row.id))
}
</script>

<style scoped lang="scss">
.leads-page { background: #f4f6f8; min-height: 100%; }
.leads-header { background: #fff; border-bottom: 1px solid #e8eaed; }
.lh-tight { line-height: 1.2; }

.kpi-chip { font-size: 13px; padding: 6px 12px; border-radius: 20px; transition: all .15s; border: 1px solid transparent; &:hover { opacity: .85; } }
.kpi-value { font-weight: 700; font-size: 15px; }
.kpi-label { font-size: 12px; opacity: .85; }

.filter-bar { background: #f4f6f8; border-bottom: 1px solid #e8eaed; }
.filter-active :deep(.q-field__control) { border-color: #26a69a !important; background: #e0f2f1 !important; }
.sort-toggle { border: 1px solid #e0e0e0; border-radius: 6px; height: 40px; }
.result-count { font-size: 12px; white-space: nowrap; }
.filter-chip { font-size: 11px; height: 24px; }

.leads-table {
  :deep(thead tr th) { position: sticky; top: 0; z-index: 1; background: #fafafa; border-bottom: 2px solid #e8eaed; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #78909c; white-space: nowrap; }
  :deep(tbody tr) { cursor: pointer; transition: background .1s; &:hover { background: #f0f9f8 !important; } }
  :deep(tbody td) { padding: 10px 12px; font-size: 13px; color: #37474f; border-bottom: 1px solid #f0f0f0; }
}

.name-cell { min-width: 180px; }
.avatar-sm { flex-shrink: 0; font-size: 11px; }
.email-link { display: block; color: #0077cc; text-decoration: none; font-size: 13px; &:hover { text-decoration: underline; } }
.region-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #eceff1; color: #546e7a; font-size: 11px; font-weight: 600; white-space: nowrap; }

.lead-chip { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;
  &--new         { background: #eceff1; color: #546e7a; }
  &--qualified   { background: #e3f2fd; color: #1565c0; }
  &--contacted   { background: #e0f2f1; color: #00695c; }
  &--proposal    { background: #ede7f6; color: #4527a0; }
  &--negotiation { background: #fff3e0; color: #e65100; }
  &--closed_won  { background: #e8f5e9; color: #2e7d32; }
  &--closed_lost { background: #ffebee; color: #c62828; }
  &--partner     { background: #f3e5f5; color: #6a1b9a; }
}

.bool-yes { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
.bool-no  { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #f5f5f5; color: #9e9e9e; }

.label-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize;
  &--hot     { background: #ffebee; color: #c62828; }
  &--warm    { background: #fff3e0; color: #e65100; }
  &--cold    { background: #e3f2fd; color: #1565c0; }
  &--default { background: #f5f5f5; color: #616161; }
}

.status-bar { background: #fff; border-top: 1px solid #e8eaed; min-height: 36px; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
