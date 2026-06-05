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
c