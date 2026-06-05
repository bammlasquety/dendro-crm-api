<template>
  <q-dialog
    v-model="open"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="contact-edit-dialog"
  >
    <q-card class="contact-edit-card column no-wrap">

      <!-- ── Sticky Header ─────────────────────────────────────────── -->
      <q-card-section class="dialog-header row items-center no-wrap q-px-lg q-py-md">
        <div class="col">
          <div class="text-subtitle2 text-grey-6 q-mb-none">Customer Lead</div>
          <div class="text-h6 text-weight-bold">Edit Contact</div>
        </div>
        <q-btn
          flat round dense
          icon="close"
          color="grey-7"
          @click="onCancel"
        />
      </q-card-section>

      <q-separator />

      <!-- ── Scrollable Body ───────────────────────────────────────── -->
      <q-scroll-area class="col">
        <div class="dialog-body q-px-lg q-py-xl">

          <!-- Avatar upload -->
          <div class="avatar-section column items-center q-mb-xl">
            <div
              class="avatar-wrapper"
              role="button"
              tabindex="0"
              aria-label="Upload profile photo"
              @click="triggerFileInput"
              @keydown.enter="triggerFileInput"
            >
              <q-avatar size="96px" class="avatar-img" color="teal-1" text-color="teal-8">
                <img v-if="avatarPreview" :src="avatarPreview" alt="Profile photo" />
                <span v-else class="text-h5 text-weight-bold">{{ initials }}</span>
              </q-avatar>

              <!-- Hover overlay -->
              <div class="avatar-overlay">
                <q-icon name="photo_camera" size="24px" color="white" />
              </div>
            </div>

            <div class="text-caption text-grey-6 q-mt-sm">Click to upload photo</div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="onFileSelected"
            />
          </div>

          <!-- ── Section: Personal Information ──────────────────────── -->
          <div class="section-block">
            <div class="section-label">
              <q-icon name="person" size="16px" class="q-mr-xs" />
              Personal Information
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.name"
                  outlined dense
                  label="Full Name"
                  :rules="[val => !!val || 'Name is required']"
                  lazy-rules
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.email"
                  outlined dense
                  label="Email Address"
                  type="email"
                  :rules="[val => !!val || 'Email is required', val => val.includes('@') || 'Invalid email']"
                  lazy-rules
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.contactNumber"
                  outlined dense
                  label="Contact Number"
                  placeholder="+63 9xx xxx xxxx"
                >
                  <template #prepend>
                    <q-icon name="call" color="grey-6" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.jobTitle"
                  outlined dense
                  label="Job Title"
                  placeholder="e.g. Farm Manager"
                />
              </div>
            </div>
          </div>

          <!-- ── Section: Location ──────────────────────────────────── -->
          <div class="section-block">
            <div class="section-label">
              <q-icon name="place" size="16px" class="q-mr-xs" />
              Location
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.farmLocation"
                  outlined dense
                  label="Farm Location"
                  placeholder="Street, barangay, municipality"
                >
                  <template #prepend>
                    <q-icon name="agriculture" color="grey-6" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.region"
                  outlined dense
                  label="Region"
                  placeholder="e.g. Region VII"
                />
              </div>
            </div>
          </div>

          <!-- ── Section: Lead Pipeline ─────────────────────────────── -->
          <div class="section-block">
            <div class="section-label">
              <q-icon name="trending_up" size="16px" class="q-mr-xs" />
              Lead Pipeline
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.lead_status"
                  outlined dense
                  label="Lead Status"
                  :options="leadStatusOptions"
                  emit-value
                  map-options
                >
                  <template #selected-item="scope">
                    <q-badge :color="leadStatusColor(scope.opt.value)" class="q-mr-xs">
                      {{ scope.opt.label }}
                    </q-badge>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.label"
                  outlined dense
                  label="Label"
                  placeholder="e.g. Hot, Warm, Cold"
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.potential_deal_value_php"
                  outlined dense
                  type="number"
                  label="Potential Deal Value"
                  placeholder="0.00"
                >
                  <template #prepend>
                    <span class="text-grey-7 text-body2 q-mr-xs">₱</span>
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <!-- ── Section: Engagement ────────────────────────────────── -->
          <div class="section-block">
            <div class="section-label">
              <q-icon name="groups" size="16px" class="q-mr-xs" />
              Engagement
            </div>

            <div class="row q-col-gutter-md">
              <!-- Webinar opt-in -->
              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Webinar Opt-in</div>
                    <div class="text-caption text-grey-6">Subscribed to webinar invites</div>
                  </div>
                  <q-toggle v-model="form.optin_webinar" color="teal" />
                </div>
              </div>

              <!-- Newsletter opt-in -->
              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Newsletter Opt-in</div>
                    <div class="text-caption text-grey-6">Subscribed to newsletter</div>
                  </div>
                  <q-toggle v-model="form.optin_newsletter" color="teal" />
                </div>
              </div>

              <!-- Webinar attended -->
              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Webinar Attended</div>
                    <div class="text-caption text-grey-6">Has attended at least one webinar</div>
                  </div>
                  <q-toggle v-model="form.webinar_attended" color="teal" />
                </div>
              </div>

              <!-- Webinar date -->
              <div v-if="form.webinar_attended" class="col-12 col-sm-6">
                <q-input
                  v-model="form.webinar_date_attended"
                  outlined dense
                  type="date"
                  label="Webinar Date Attended"
                  stack-label
                />
              </div>
            </div>
          </div>

          <!-- ── Section: Notes ──────────────────────────────────────── -->
          <div class="section-block">
            <div class="section-label">
              <q-icon name="notes" size="16px" class="q-mr-xs" />
              Notes
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.notes"
                  outlined
                  type="textarea"
                  label="General Notes"
                  :input-style="{ minHeight: '80px' }"
                  placeholder="Any relevant notes about this contact…"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.farm_notes"
                  outlined
                  type="textarea"
                  label="Farm Notes"
                  :input-style="{ minHeight: '80px' }"
                  placeholder="Details about the farm, crops, conditions…"
                >
                  <template #prepend>
                    <q-icon name="agriculture" color="grey-6" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <!-- ── Section: Account Status ─────────────────────────────── -->
          <div class="section-block section-block--last">
            <div class="section-label">
              <q-icon name="manage_accounts" size="16px" class="q-mr-xs" />
              Account Status
            </div>

            <div class="toggle-row status-toggle-row">
              <div>
                <div class="text-body2 text-weight-medium">
                  {{ form.status === 'active' ? 'Active' : 'Inactive' }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ form.status === 'active'
                    ? 'This contact is active and visible in the pipeline.'
                    : 'This contact is inactive and hidden from default views.' }}
                </div>
              </div>
              <q-toggle
                :model-value="form.status === 'active'"
                color="positive"
                @update:model-value="v => form.status = v ? 'active' : 'inactive'"
              />
            </div>
          </div>

        </div>
      </q-scroll-area>

      <!-- ── Sticky Footer ─────────────────────────────────────────── -->
      <q-separator />

      <q-card-actions class="dialog-footer q-px-lg q-py-md row justify-end q-gutter-sm">
        <q-btn
          flat
          label="Cancel"
          color="grey-7"
          :disable="saving"
          @click="onCancel"
        />
        <q-btn
          unelevated
          label="Save Changes"
          color="teal"
          icon-right="save"
          :loading="saving"
          @click="onSave"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ContactRow, LeadStatus } from '../types/contacts'

// ─── Props & Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  contact: ContactRow | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', updated: ContactRow & { id: string }): void
}>()

// ─── Dialog open state ────────────────────────────────────────────────────────

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ─── Form state ───────────────────────────────────────────────────────────────

interface EditForm {
  name: string
  email: string
  contactNumber: string
  jobTitle: string
  farmLocation: string
  region: string
  lead_status: LeadStatus
  label: string
  potential_deal_value_php: number | null
  optin_webinar: boolean
  optin_newsletter: boolean
  webinar_attended: boolean
  webinar_date_attended: string
  notes: string
  farm_notes: string
  status: 'active' | 'inactive'
}

function blankForm(): EditForm {
  return {
    name: '',
    email: '',
    contactNumber: '',
    jobTitle: '',
    farmLocation: '',
    region: '',
    lead_status: 'new',
    label: '',
    potential_deal_value_php: null,
    optin_webinar: false,
    optin_newsletter: false,
    webinar_attended: false,
    webinar_date_attended: '',
    notes: '',
    farm_notes: '',
    status: 'active',
  }
}

const form = ref<EditForm>(blankForm())
const saving = ref(false)

// Populate form when contact changes
watch(
  () => props.contact,
  (c) => {
    if (!c) { form.value = blankForm(); return }
    form.value = {
      name: c.name,
      email: c.email,
      contactNumber: c.contactNumber ?? '',
      jobTitle: c.jobTitle ?? '',
      farmLocation: c.farmLocation ?? '',
      region: c.region ?? '',
      lead_status: c.leadStatus,
      label: c.label ?? '',
      potential_deal_value_php: null,       // not in ContactRow; will be fetched if needed
      optin_webinar: c.webinarOptIn,
      optin_newsletter: c.newsletterOptIn,
      webinar_attended: c.webinarAttended,
      webinar_date_attended: '',
      notes: '',
      farm_notes: '',
      status: c.status,
    }
    avatarPreview.value = null
  },
  { immediate: true },
)

// ─── Avatar upload ────────────────────────────────────────────────────────────

const fileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)

const initials = computed(() => {
  const parts = (form.value.name || '?').trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// ─── Lead status options ──────────────────────────────────────────────────────

const leadStatusOptions = [
  { label: 'New',         value: 'new' },
  { label: 'Qualified',   value: 'qualified' },
  { label: 'Contacted',   value: 'contacted' },
  { label: 'Proposal',    value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Closed Won',  value: 'closed_won' },
  { label: 'Closed Lost', value: 'closed_lost' },
  { label: 'Partner',     value: 'partner' },
]

function leadStatusColor(s: LeadStatus): string {
  switch (s) {
    case 'new':         return 'grey-6'
    case 'qualified':   return 'primary'
    case 'contacted':   return 'teal'
    case 'proposal':    return 'indigo'
    case 'negotiation': return 'orange'
    case 'closed_won':  return 'positive'
    case 'closed_lost': return 'negative'
    case 'partner':     return 'purple'
    default:            return 'grey-6'
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function onSave() {
  if (!props.contact) return

  saving.value = true
  try {
    // Build snake_case patch payload matching the PATCHABLE_COLUMNS whitelist
    const patch: Record<string, unknown> = {
      name:                      form.value.name,
      email:                     form.value.email,
      contact_number:            form.value.contactNumber || null,
      job_title:                 form.value.jobTitle || null,
      farm_location:             form.value.farmLocation || null,
      region:                    form.value.region || null,
      lead_status:               form.value.lead_status,
      label:                     form.value.label || null,
      potential_deal_value_php:  form.value.potential_deal_value_php,
      optin_webinar:             form.value.optin_webinar,
      optin_newsletter:          form.value.optin_newsletter,
      webinar_attended:          form.value.webinar_attended,
      webinar_date_attended:     form.value.webinar_attended && form.value.webinar_date_attended
                                   ? form.value.webinar_date_attended
                                   : null,
      notes:                     form.value.notes || null,
      farm_notes:                form.value.farm_notes || null,
      status:                    form.value.status,
    }

    const res = await fetch(`/api/customer-leads/${props.contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
    }

    // Emit updated ContactRow back to parent for optimistic UI update.
    // exactOptionalPropertyTypes requires optional keys to be *omitted* rather than set to undefined.
    const f = form.value
    const updated: ContactRow = {
      ...props.contact,
      name: f.name,
      email: f.email,
      leadStatus: f.lead_status,
      webinarOptIn: f.optin_webinar,
      newsletterOptIn: f.optin_newsletter,
      webinarAttended: f.webinar_attended,
      status: f.status,
      ...(f.contactNumber ? { contactNumber: f.contactNumber } : {}),
      ...(f.jobTitle      ? { jobTitle: f.jobTitle }           : {}),
      ...(f.farmLocation  ? { farmLocation: f.farmLocation }   : {}),
      ...(f.region        ? { region: f.region }               : {}),
      ...(f.label         ? { label: f.label }                 : {}),
    }

    emit('saved', updated)
    open.value = false
  } catch (err) {
    console.error('[ContactEditDialog] save failed:', err)
    // Bubble error up — parent shows the notification
    throw err
  } finally {
    saving.value = false
  }
}

function onCancel() {
  if (!saving.value) open.value = false
}
</script>

<style scoped lang="scss">
.contact-edit-card {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  height: 100%;
  max-height: 100dvh;
}

.dialog-header {
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dialog-footer {
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

// ── Avatar ──────────────────────────────────────────────────────────────────

.avatar-section {
  padding-top: 8px;
}

.avatar-wrapper {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  border-radius: 50%;
  outline-offset: 3px;

  &:focus-visible {
    outline: 2px solid #26a69a;
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-img {
  border: 3px solid #e0f2f1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: filter 0.2s;

  .avatar-wrapper:hover & {
    filter: brightness(0.75);
  }
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.hidden-input {
  display: none;
}

// ── Sections ─────────────────────────────────────────────────────────────────

.dialog-body {
  max-width: 600px;
  margin: 0 auto;
}

.section-block {
  margin-bottom: 32px;

  &--last {
    margin-bottom: 0;
  }
}

.section-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #78909c;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eceff1;
}

// ── Toggle rows ───────────────────────────────────────────────────────────────

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #eceff1;
  border-radius: 8px;
  background: #fafafa;
  min-height: 64px;
}

.status-toggle-row {
  background: #f1f8e9;
  border-color: #c5e1a5;
}
</style>
