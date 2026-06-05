<template>
  <q-dialog
    v-model="open"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="lead-dialog-card column no-wrap">

      <!-- ── Sticky Header ─────────────────────────────────────────── -->
      <div class="dialog-header row items-center no-wrap q-px-lg q-py-md">
        <div class="col">
          <div class="text-overline text-teal q-mb-none" style="line-height:1">New Contact</div>
          <div class="text-h6 text-weight-bold text-grey-9">Add Lead</div>
        </div>
        <q-btn flat round dense icon="close" color="grey-6" :disable="saving" @click="onCancel" />
      </div>

      <q-separator />

      <!-- ── Progress indicator ─────────────────────────────────────── -->
      <div class="step-bar row items-center q-px-lg q-py-sm q-gutter-sm">
        <div
          v-for="(step, i) in steps"
          :key="step.key"
          class="step-item row items-center q-gutter-xs"
          :class="{ 'step-item--active': currentStep === i, 'step-item--done': currentStep > i }"
        >
          <div class="step-dot">
            <q-icon v-if="currentStep > i" name="check" size="10px" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
          <q-icon v-if="i < steps.length - 1" name="chevron_right" size="14px" color="grey-4" />
        </div>
      </div>

      <q-separator />

      <!-- ── Scrollable Body ───────────────────────────────────────── -->
      <q-scroll-area class="col">
        <div class="dialog-body q-px-lg q-py-lg">

          <!-- ══ Step 0: Identity ══════════════════════════════════════ -->
          <div v-show="currentStep === 0">

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
                <q-avatar size="88px" class="avatar-img" :color="avatarBgColor" text-color="white">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="Profile photo" />
                  <span v-else class="text-h5 text-weight-bold">{{ initials }}</span>
                </q-avatar>
                <div class="avatar-overlay">
                  <q-icon name="photo_camera" size="22px" color="white" />
                </div>
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">Optional photo</div>
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="onFileSelected" />
            </div>

            <div class="section-label">
              <q-icon name="person" size="15px" class="q-mr-xs" />Personal Information
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  ref="nameRef"
                  v-model="form.name"
                  outlined dense
                  label="Full Name *"
                  autofocus
                  :rules="[v => !!v.trim() || 'Name is required']"
                  lazy-rules="ondemand"
                  @keydown.enter="focusNext"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  ref="emailRef"
                  v-model="form.email"
                  outlined dense
                  label="Email Address *"
                  type="email"
                  :rules="[v => !!v.trim() || 'Email is required', v => v.includes('@') || 'Enter a valid email']"
                  lazy-rules="ondemand"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.contactNumber"
                  outlined dense
                  label="Contact Number"
                  placeholder="+63 9xx xxx xxxx"
                >
                  <template #prepend><q-icon name="call" color="grey-5" size="18px" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.jobTitle" outlined dense label="Job Title" placeholder="e.g. Farm Manager" />
              </div>
            </div>

            <div class="section-label q-mt-lg">
              <q-icon name="place" size="15px" class="q-mr-xs" />Location
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.farmLocation"
                  outlined dense
                  label="Farm Location"
                  placeholder="Street, barangay, municipality"
                >
                  <template #prepend><q-icon name="agriculture" color="grey-5" size="18px" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.region" outlined dense label="Region" placeholder="e.g. Region VII" />
              </div>
            </div>
          </div>

          <!-- ══ Step 1: Pipeline ══════════════════════════════════════ -->
          <div v-show="currentStep === 1">

            <div class="section-label">
              <q-icon name="trending_up" size="15px" class="q-mr-xs" />Lead Pipeline
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.lead_status"
                  outlined dense
                  label="Lead Stage"
                  :options="leadStatusOptions"
                  emit-value map-options
                >
                  <template #selected-item="scope">
                    <span :class="['lead-chip', `lead-chip--${scope.opt.value}`]">{{ scope.opt.label }}</span>
                  </template>
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <span :class="['lead-dot', `lead-dot--${scope.opt.value}`]" />
                      </q-item-section>
                      <q-item-section>{{ scope.opt.label }}</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6">
                <q-input v-model="form.label" outlined dense label="Label" placeholder="e.g. Hot, Warm, Cold" />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.potential_deal_value_php"
                  outlined dense
                  type="number"
                  label="Potential Deal Value"
                  placeholder="0.00"
                  min="0"
                >
                  <template #prepend>
                    <span class="text-grey-6 text-body2">₱</span>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="section-label q-mt-lg">
              <q-icon name="groups" size="15px" class="q-mr-xs" />Engagement
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Webinar Opt-in</div>
                    <div class="text-caption text-grey-6">Subscribed to webinar invites</div>
                  </div>
                  <q-toggle v-model="form.optin_webinar" color="teal" />
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Newsletter Opt-in</div>
                    <div class="text-caption text-grey-6">Subscribed to newsletter</div>
                  </div>
                  <q-toggle v-model="form.optin_newsletter" color="teal" />
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <div class="toggle-row">
                  <div>
                    <div class="text-body2 text-weight-medium">Webinar Attended</div>
                    <div class="text-caption text-grey-6">Has attended at least one webinar</div>
                  </div>
                  <q-toggle v-model="form.webinar_attended" color="teal" />
                </div>
              </div>

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

          <!-- ══ Step 2: Notes & Status ════════════════════════════════ -->
          <div v-show="currentStep === 2">

            <div class="section-label">
              <q-icon name="notes" size="15px" class="q-mr-xs" />Notes
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.notes"
                  outlined
                  type="textarea"
                  label="General Notes"
                  :input-style="{ minHeight: '88px' }"
                  placeholder="Any relevant context about this lead…"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.farm_notes"
                  outlined
                  type="textarea"
                  label="Farm Notes"
                  :input-style="{ minHeight: '88px' }"
                  placeholder="Farm details, crops, conditions, visit history…"
                >
                  <template #prepend><q-icon name="agriculture" color="grey-5" size="18px" /></template>
                </q-input>
              </div>
            </div>

            <div class="section-label q-mt-lg">
              <q-icon name="manage_accounts" size="15px" class="q-mr-xs" />Account Status
            </div>

            <div :class="['toggle-row', form.status === 'active' ? 'toggle-row--active' : 'toggle-row--inactive']">
              <div>
                <div class="text-body2 text-weight-medium">
                  {{ form.status === 'active' ? 'Active' : 'Inactive' }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ form.status === 'active'
                    ? 'Visible in the pipeline and all active views.'
                    : 'Hidden from default views until reactivated.' }}
                </div>
              </div>
              <q-toggle
                :model-value="form.status === 'active'"
                color="positive"
                @update:model-value="v => form.status = v ? 'active' : 'inactive'"
              />
            </div>

            <!-- Summary card before save -->
            <div class="summary-card q-mt-xl">
              <div class="text-caption text-grey-5 text-uppercase text-weight-bold q-mb-sm" style="letter-spacing:.06em">Review summary</div>
              <div class="row q-col-gutter-sm">
                <div class="col-6 summary-item">
                  <span class="summary-key">Name</span>
                  <span class="summary-val">{{ form.name || '—' }}</span>
                </div>
                <div class="col-6 summary-item">
                  <span class="summary-key">Email</span>
                  <span class="summary-val ellipsis">{{ form.email || '—' }}</span>
                </div>
                <div class="col-6 summary-item">
                  <span class="summary-key">Stage</span>
                  <span :class="['lead-chip', `lead-chip--${form.lead_status}`]">{{ prettyStage(form.lead_status) }}</span>
                </div>
                <div class="col-6 summary-item">
                  <span class="summary-key">Region</span>
                  <span class="summary-val">{{ form.region || '—' }}</span>
                </div>
                <div class="col-6 summary-item">
                  <span class="summary-key">Status</span>
                  <span :class="form.status === 'active' ? 'bool-yes' : 'bool-no'">{{ form.status }}</span>
                </div>
                <div class="col-6 summary-item">
                  <span class="summary-key">Deal value</span>
                  <span class="summary-val">{{ form.potential_deal_value_php ? `₱${form.potential_deal_value_php.toLocaleString()}` : '—' }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </q-scroll-area>

      <!-- ── Sticky Footer ─────────────────────────────────────────── -->
      <q-separator />

      <div class="dialog-footer row items-center justify-between q-px-lg q-py-sm">
        <q-btn
          flat no-caps
          :label="currentStep === 0 ? 'Cancel' : 'Back'"
          :icon="currentStep > 0 ? 'arrow_back' : undefined"
          color="grey-6"
          :disable="saving"
          @click="onBack"
        />

        <div class="row items-center q-gutter-xs">
          <!-- Step dots -->
          <div
            v-for="(_, i) in steps"
            :key="i"
            :class="['step-dot-mini', { 'step-dot-mini--active': i === currentStep }]"
          />
        </div>

        <q-btn
          v-if="currentStep < steps.length - 1"
          unelevated no-caps
          label="Continue"
          icon-right="arrow_forward"
          color="teal"
          @click="onNext"
        />
        <q-btn
          v-else
          unelevated no-caps
          label="Save Lead"
          icon-right="person_add"
          color="teal"
          :loading="saving"
          @click="onSave"
        />
      </div>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { QInput } from 'quasar'
import type { ContactRow, LeadStatus } from '../types/contacts'

// ─── Props & Emits ────────────────────────────────────────────────────────────

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', lead: ContactRow): void
}>()

const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

// ─── Step wizard ──────────────────────────────────────────────────────────────

const steps = [
  { key: 'identity', label: 'Identity' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'notes',    label: 'Notes & Save' },
]

const currentStep = ref(0)

// Reset step when dialog opens
watch(open, v => {
  if (v) { currentStep.value = 0; resetForm() }
})

// ─── Form state ───────────────────────────────────────────────────────────────

interface AddForm {
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

function blankForm(): AddForm {
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

const form = ref<AddForm>(blankForm())
const saving = ref(false)

function resetForm() {
  form.value = blankForm()
  avatarPreview.value = null
}

// ─── Validation refs ──────────────────────────────────────────────────────────

const nameRef  = ref<InstanceType<typeof QInput> | null>(null)
const emailRef = ref<InstanceType<typeof QInput> | null>(null)

async function validateStep0(): Promise<boolean> {
  const nameOk  = await nameRef.value?.validate()  ?? false
  const emailOk = await emailRef.value?.validate() ?? false
  return nameOk && emailOk
}

// ─── Navigation ───────────────────────────────────────────────────────────────

async function onNext() {
  if (currentStep.value === 0) {
    const valid = await validateStep0()
    if (!valid) return
  }
  currentStep.value++
}

function onBack() {
  if (currentStep.value === 0) { onCancel(); return }
  currentStep.value--
}

function onCancel() {
  if (!saving.value) open.value = false
}

function focusNext() {
  emailRef.value?.focus()
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

const fileInputRef   = ref<HTMLInputElement | null>(null)
const avatarPreview  = ref<string | null>(null)

const AVATAR_COLORS = ['teal-7', 'indigo-6', 'deep-orange-6', 'purple-7', 'blue-7', 'cyan-8', 'green-8']

const avatarBgColor = computed(() => {
  if (!form.value.name) return 'grey-5'
  let hash = 0
  for (let i = 0; i < form.value.name.length; i++)
    hash = form.value.name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'teal-7'
})

const initials = computed(() => {
  const parts = (form.value.name || '?').trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
})

function triggerFileInput() { fileInputRef.value?.click() }

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => { avatarPreview.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

// ─── Lead status options ──────────────────────────────────────────────────────

const leadStatusOptions: { label: string; value: LeadStatus }[] = [
  { label: 'New',          value: 'new' },
  { label: 'Qualified',    value: 'qualified' },
  { label: 'Contacted',    value: 'contacted' },
  { label: 'Proposal',     value: 'proposal' },
  { label: 'Negotiation',  value: 'negotiation' },
  { label: 'Closed Won',   value: 'closed_won' },
  { label: 'Closed Lost',  value: 'closed_lost' },
  { label: 'Partner',      value: 'partner' },
]

function prettyStage(s: LeadStatus): string {
  return leadStatusOptions.find(o => o.value === s)?.label ?? s
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function onSave() {
  saving.value = true
  try {
    const f = form.value
    const payload: Record<string, unknown> = {
      name:                     f.name.trim(),
      email:                    f.email.trim(),
      contact_number:           f.contactNumber  || null,
      job_title:                f.jobTitle        || null,
      farm_location:            f.farmLocation    || null,
      region:                   f.region          || null,
      lead_status:              f.lead_status,
      label:                    f.label           || null,
      potential_deal_value_php: f.potential_deal_value_php,
      optin_webinar:            f.optin_webinar,
      optin_newsletter:         f.optin_newsletter,
      webinar_attended:         f.webinar_attended,
      webinar_date_attended:    f.webinar_attended && f.webinar_date_attended
                                  ? f.webinar_date_attended : null,
      notes:                    f.notes      || null,
      farm_notes:               f.farm_notes || null,
      status:                   f.status,
    }

    const res = await fetch('/api/customer-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const body = await res.json().catch(() => ({})) as { success?: boolean; error?: string; lead?: Record<string, unknown> }

    if (!res.ok) {
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }

    // Build ContactRow from the returned lead record
    const row = body.lead ?? {}
    const s = (v: unknown): string | undefined => typeof v === 'string' && v.length > 0 ? v : undefined

    // Construct with required fields only; assign optional fields after so TypeScript
    // narrows each value to `string` inside the `if` — required by exactOptionalPropertyTypes.
    const created: ContactRow = {
      id:              s(row['id'])          ?? '',
      name:            s(row['name'])        ?? f.name,
      email:           s(row['email'])       ?? f.email,
      status:          (row['status']      as 'active' | 'inactive') ?? f.status,
      leadStatus:      (row['lead_status'] as LeadStatus)             ?? f.lead_status,
      webinarOptIn:    Boolean(row['optin_webinar']),
      webinarAttended: Boolean(row['webinar_attended']),
      newsletterOptIn: Boolean(row['optin_newsletter']),
      createdAt:       s(row['created_at']) ?? new Date().toISOString(),
    }
    const cn = s(row['contact_number']); if (cn) created.contactNumber = cn;
    const jt = s(row['job_title']);      if (jt) created.jobTitle      = jt;
    const fl = s(row['farm_location']);  if (fl) created.farmLocation  = fl;
    const rg = s(row['region']);         if (rg) created.region        = rg;
    const lb = s(row['label']);          if (lb) created.label         = lb;

    emit('created', created)
    open.value = false
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save lead.'
    console.error('[AddLeadDialog] save failed:', err)
    $q.notify({ type: 'negative', icon: 'error_outline', message: msg, timeout: 5000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
// ── Card ─────────────────────────────────────────────────────────────────────

.lead-dialog-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  height: 100%;
  max-height: 100dvh;
  background: #fff;
}

// ── Header / Footer ───────────────────────────────────────────────────────────

.dialog-header {
  background: #fff;
}

.dialog-footer {
  background: #fff;
  min-height: 60px;
}

// ── Step wizard bar ───────────────────────────────────────────────────────────

.step-bar {
  background: #fafafa;
  overflow-x: auto;
}

.step-item {
  opacity: 0.45;
  transition: opacity 0.2s;

  &--active { opacity: 1; }
  &--done   { opacity: 0.7; }
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #9e9e9e;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  flex-shrink: 0;

  .step-item--active & {
    background: #26a69a;
    color: #fff;
  }

  .step-item--done & {
    background: #b2dfdb;
    color: #00695c;
  }
}

.step-label {
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
  white-space: nowrap;

  .step-item--active & { color: #00695c; }
}

// ── Footer step dots ──────────────────────────────────────────────────────────

.step-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background 0.2s, width 0.2s;

  &--active {
    background: #26a69a;
    width: 18px;
    border-radius: 4px;
  }
}

// ── Body ─────────────────────────────────────────────────────────────────────

.dialog-body {
  max-width: 560px;
  margin: 0 auto;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

.avatar-section { padding-top: 4px; }

.avatar-wrapper {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  border-radius: 50%;
  outline-offset: 3px;
  &:focus-visible { outline: 2px solid #26a69a; }
  &:hover .avatar-overlay { opacity: 1; }
}

.avatar-img {
  border: 3px solid #e0f2f1;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
  transition: filter 0.2s;
  .avatar-wrapper:hover & { filter: brightness(0.72); }
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

.hidden-input { display: none; }

// ── Section labels ────────────────────────────────────────────────────────────

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

  &--active   { background: #f1f8e9; border-color: #c5e1a5; }
  &--inactive { background: #fafafa; border-color: #eceff1; }
}

// ── Lead chips (shared with ContactsList) ─────────────────────────────────────

.lead-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  &--new         { background: #eceff1; color: #546e7a; }
  &--qualified   { background: #e3f2fd; color: #1565c0; }
  &--contacted   { background: #e0f2f1; color: #00695c; }
  &--proposal    { background: #ede7f6; color: #4527a0; }
  &--negotiation { background: #fff3e0; color: #e65100; }
  &--closed_won  { background: #e8f5e9; color: #2e7d32; }
  &--closed_lost { background: #ffebee; color: #c62828; }
  &--partner     { background: #f3e5f5; color: #6a1b9a; }
}

.lead-dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  &--new         { background: #90a4ae; }
  &--qualified   { background: #1976d2; }
  &--contacted   { background: #00897b; }
  &--proposal    { background: #5e35b1; }
  &--negotiation { background: #fb8c00; }
  &--closed_won  { background: #43a047; }
  &--closed_lost { background: #e53935; }
  &--partner     { background: #8e24aa; }
}

.bool-yes {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 600; background: #e8f5e9; color: #2e7d32;
}
.bool-no {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 600; background: #f5f5f5; color: #9e9e9e;
}

// ── Summary card ──────────────────────────────────────────────────────────────

.summary-card {
  background: #f8fafb;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  padding: 16px;
}

.summary-item {
  display: flex;
  flex-dire