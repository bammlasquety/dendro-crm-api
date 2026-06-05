<template>
  <q-page class="dashboard-page">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="dash-header q-px-lg q-pt-lg q-pb-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-grey-9 lh-tight">{{ greeting }}, Bamm</div>
          <div class="text-caption text-grey-5 q-mt-xs">{{ todayLabel }}</div>
        </div>
        <q-btn unelevated color="teal" icon="people" label="View All Leads" no-caps to="/customers" />
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div v-if="loading" class="q-px-lg q-pt-md">
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="n in 4" :key="n" class="col-6 col-md-3"><q-skeleton height="96px" bordered /></div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-9"><q-skeleton height="220px" bordered /></div>
        <div class="col-12 col-lg-3"><q-skeleton height="220px" bordered /></div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-lg-7"><q-skeleton height="280px" bordered /></div>
        <div class="col-12 col-lg-5"><q-skeleton height="280px" bordered /></div>
      </div>
    </div>

    <div v-else>

      <!-- ── Row 1: KPI cards ──────────────────────────────────────────── -->
      <div class="q-px-lg q-pt-md q-pb-sm">
        <div class="row q-col-gutter-md">

          <div class="col-6 col-md-3">
            <div class="kpi-card">
              <div class="kpi-icon-wrap kpi-icon-wrap--blue"><q-icon name="people" size="22px" color="white" /></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ fmt(stats.active) }}</div>
                <div class="kpi-label">Active Leads</div>
                <div class="kpi-sub">{{ fmt(stats.total) }} total · {{ fmt(stats.inactive) }} inactive</div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-card">
              <div class="kpi-icon-wrap kpi-icon-wrap--teal"><q-icon name="trending_up" size="22px" color="white" /></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ fmt(stats.newLast90) }}</div>
                <div class="kpi-label">New Leads (90 days)</div>
                <div class="kpi-sub">{{ fmt(stats.newThisMonth) }} this month · {{ fmt(stats.newLast30) }} last 30d</div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-card">
              <div class="kpi-icon-wrap kpi-icon-wrap--purple"><q-icon name="payments" size="22px" color="white" /></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ fmtPeso(stats.totalDealValuePhp) }}</div>
                <div class="kpi-label">Pipeline Value</div>
                <div class="kpi-sub">Potential deal total</div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-card">
              <div class="kpi-icon-wrap kpi-icon-wrap--orange"><q-icon name="groups" size="22px" color="white" /></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ fmt(stats.webinarAttended) }}</div>
                <div class="kpi-label">Webinar Attended</div>
                <div class="kpi-sub">{{ fmt(stats.webinarOptIn) }} opted in</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Row 2: Lead Growth (3/4) + Recent Leads (1/4) ────────────── -->
      <div class="q-px-lg q-pt-md">
        <div class="row q-col-gutter-md">

          <!-- Lead Growth chart -->
          <div class="col-12 col-lg-9">
            <div class="dash-card">
              <div class="dash-card__header">
                <div>
                  <div class="dash-card__title">Lead Growth</div>
                  <div class="text-caption text-grey-5 q-mt-xs">New leads added per month — last 12 months</div>
                </div>
                <div class="text-caption text-grey-5 text-right">
                  Total tracked: <strong class="text-grey-8">{{ fmt(stats.total) }}</strong> leads
                </div>
              </div>

              <div class="chart-wrap">
                <div class="chart-bars">
                  <div v-for="m in stats.monthlyGrowth" :key="m.month" class="chart-col">
                    <div class="chart-bar-label">{{ m.count > 0 ? fmt(m.count) : '' }}</div>
                    <div class="chart-bar-track">
                      <div
                        class="chart-bar-fill"
                        :class="{ 'chart-bar-fill--current': m.month === currentYearMonth }"
                        :style="{ height: maxMonthCount > 0 ? Math.max(m.count > 0 ? 6 : 0, (m.count / maxMonthCount) * 100) + '%' : '0%' }"
                      ></div>
                    </div>
                    <div class="chart-bar-month" :class="{ 'chart-bar-month--current': m.month === currentYearMonth }">
                      {{ m.label }}
                    </div>
                  </div>
                </div>
                <!-- Y-axis hint -->
                <div v-if="maxMonthCount > 0" class="chart-legend text-caption text-grey-4">
                  Peak: {{ fmt(maxMonthCount) }} leads
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Leads (compact 1/4) -->
          <div class="col-12 col-lg-3">
            <div class="dash-card full-height recent-card">
              <div class="dash-card__header">
                <div class="dash-card__title">Recent</div>
                <q-btn flat dense no-caps color="teal" label="All" size="sm" to="/customers" />
              </div>

              <div v-if="recentLeads.length === 0" class="empty-state">
                <q-icon name="people_outline" size="32px" color="grey-4" />
                <div class="text-caption text-grey-5 q-mt-xs">No leads yet</div>
              </div>

              <div v-else class="recent-list">
                <div
                  v-for="lead in recentLeads"
                  :key="lead.id"
                  class="recent-row"
                  @click="$router.push('/customers')"
                >
                  <q-avatar size="28px" :color="avatarColor(lead.name)" text-color="white" class="flex-shrink-0">
                    <span class="avatar-text">{{ initials(lead.name) }}</span>
                  </q-avatar>
                  <div class="col-grow" style="min-width:0">
                    <div class="recent-row__name ellipsis">{{ lead.name }}</div>
                    <div class="row items-center justify-between no-wrap">
                      <span :class="['lead-dot-chip', 'lead-dot-chip--' + lead.lead_status]">
                        {{ stageLabel(lead.lead_status) }}
                      </span>
                      <span class="recent-row__time">{{ relativeDate(lead.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Row 3: Lead Pipeline (7/12) + Engagement (5/12) ──────────── -->
      <div class="q-px-lg q-pt-md q-pb-lg">
        <div class="row q-col-gutter-md">

          <!-- Pipeline funnel -->
          <div class="col-12 col-lg-7">
            <div class="dash-card full-height">
              <div class="dash-card__header">
                <div class="dash-card__title">Lead Pipeline</div>
                <div class="text-caption text-grey-5">By stage · all {{ fmt(stats.total) }} leads</div>
              </div>
              <div class="pipeline-list">
                <div v-for="stage in pipelineStages" :key="stage.key" class="pipeline-row">
                  <span :class="['lead-chip', 'lead-chip--' + stage.key]" class="pipeline-chip">{{ stage.label }}</span>
                  <div class="pipeline-bar-track">
                    <div
                      class="pipeline-bar-fill"
                      :style="{ width: maxStageCount ? (stage.count / maxStageCount * 100) + '%' : '0%', background: stage.color }"
                    />
                  </div>
                  <span class="pipeline-row__count">{{ fmt(stage.count) }}</span>
                  <span class="pipeline-row__pct">{{ stats.total ? pct(stage.count, stats.total) : '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Engagement + Top regions -->
          <div class="col-12 col-lg-5">
            <div class="dash-card full-height">
              <div class="dash-card__header">
                <div class="dash-card__title">Engagement</div>
              </div>

              <div class="engagement-list">
                <div class="engagement-row">
                  <div class="engagement-icon engagement-icon--teal"><q-icon name="mail" size="16px" /></div>
                  <div class="col-grow">
                    <div class="eng-label">Newsletter opt-in</div>
                    <div class="eng-track"><div class="eng-fill eng-fill--teal" :style="{ width: engPct(stats.newsletterOptIn) }"></div></div>
                  </div>
                  <div class="engagement-count">{{ fmt(stats.newsletterOptIn) }}<span class="text-grey-5"> / {{ fmt(stats.total) }}</span></div>
                </div>

                <div class="engagement-row">
                  <div class="engagement-icon engagement-icon--purple"><q-icon name="event" size="16px" /></div>
                  <div class="col-grow">
                    <div class="eng-label">Webinar opt-in</div>
                    <div class="eng-track"><div class="eng-fill eng-fill--purple" :style="{ width: engPct(stats.webinarOptIn) }"></div></div>
                  </div>
                  <div class="engagement-count">{{ fmt(stats.webinarOptIn) }}<span class="text-grey-5"> / {{ fmt(stats.total) }}</span></div>
                </div>

                <div class="engagement-row">
                  <div class="engagement-icon engagement-icon--green"><q-icon name="how_to_reg" size="16px" /></div>
                  <div class="col-grow">
                    <div class="eng-label">Webinar attended</div>
                    <div class="eng-track"><div class="eng-fill eng-fill--green" :style="{ width: engPct(stats.webinarAttended) }"></div></div>
                  </div>
                  <div class="engagement-count">{{ fmt(stats.webinarAttended) }}<span class="text-grey-5"> / {{ fmt(stats.total) }}</span></div>
                </div>
              </div>

              <div class="region-section">
                <div class="dash-card__title q-mb-sm" style="font-size:12px">Top Regions</div>
                <div class="region-list">
                  <div v-for="r in stats.byRegion.slice(0, 6)" :key="r.region" class="region-row">
                    <div class="region-bar-wrap">
                      <div class="region-name ellipsis">{{ r.region }}</div>
                      <div class="region-track">
                        <div class="region-fill" :style="{ width: maxRegionCount ? (r.count / maxRegionCount * 100) + '%' : '0%' }"></div>
                      </div>
                    </div>
                    <span class="region-count">{{ fmt(r.count) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface MonthEntry  { month: string; label: string; count: number }
interface RegionEntry { region: string; count: number }

interface DashStats {
  total: number; active: number; inactive: number
  newThisMonth: number; newLast30: number; newLast90: number
  totalDealValuePhp: number
  webinarOptIn: number; webinarAttended: number; newsletterOptIn: number
  byStage: Record<string, number>; byRegion: RegionEntry[]; monthlyGrowth: MonthEntry[]
}

interface RecentLead {
  id: string; name: string; email: string; job_title: string | null
  lead_status: string; status: string; region: string | null; created_at: string
}

const loading = ref(true)
const stats = ref<DashStats>({
  total: 0, active: 0, inactive: 0, newThisMonth: 0, newLast30: 0, newLast90: 0,
  totalDealValuePhp: 0, webinarOptIn: 0, webinarAttended: 0, newsletterOptIn: 0,
  byStage: {}, byRegion: [], monthlyGrowth: [],
})
const recentLeads = ref<RecentLead[]>([])

async function loadDashboard() {
  loading.value = true
  try {
    const [statsRes, recentRes] = await Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json() as Promise<{ success: boolean; stats: DashStats }>),
      fetch('/api/dashboard/recent-leads').then(r => r.json() as Promise<{ success: boolean; leads: RecentLead[] }>),
    ])
    if (statsRes.success)  stats.value       = statsRes.stats
    if (recentRes.success) recentLeads.value = recentRes.leads
  } catch (err) {
    console.error('[Dashboard] load failed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)

// ── Header ──────────────────────────────────────────────────────────────────

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)

// Current month key in the same UTC format the server uses
const currentYearMonth = computed(() => {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

// ── Pipeline ────────────────────────────────────────────────────────────────

const STAGE_META = [
  { key: 'new',         label: 'New',         color: '#90a4ae' },
  { key: 'qualified',   label: 'Qualified',    color: '#1976d2' },
  { key: 'contacted',   label: 'Contacted',    color: '#00897b' },
  { key: 'proposal',    label: 'Proposal',     color: '#5e35b1' },
  { key: 'negotiation', label: 'Negotiation',  color: '#fb8c00' },
  { key: 'closed_won',  label: 'Closed Won',   color: '#43a047' },
  { key: 'closed_lost', label: 'Closed Lost',  color: '#e53935' },
  { key: 'partner',     label: 'Partner',      color: '#8e24aa' },
]

const pipelineStages = computed(() =>
  STAGE_META.map(s => ({ ...s, count: stats.value.byStage[s.key] ?? 0 }))
)
const maxStageCount = computed(() => Math.max(...pipelineStages.value.map(s => s.count), 1))

function stageLabel(key: string) { return STAGE_META.find(s => s.key === key)?.label ?? key }

// ── Chart ───────────────────────────────────────────────────────────────────

const maxMonthCount = computed(() =>
  Math.max(...stats.value.monthlyGrowth.map(m => m.count), 0)
)

// ── Regions ─────────────────────────────────────────────────────────────────

const maxRegionCount = computed(() =>
  Math.max(...stats.value.byRegion.map(r => r.count), 1)
)

// ── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['teal-7','indigo-6','deep-orange-6','purple-7','blue-7','cyan-8','green-8']
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] ?? 'teal'
}
function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? (p[0]?.[0] ?? '?').toUpperCase()
    : ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

function fmt(n: number) { return n.toLocaleString('en-PH') }
function fmtPeso(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${fmt(n)}`
}
function pct(part: number, total: number) {
  return total ? `${Math.round((part / total) * 100)}%` : '0%'
}
function engPct(n: number) {
  return stats.value.total ? `${(n / stats.value.total * 100).toFixed(1)}%` : '0%'
}
function relativeDate(iso: string) {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return `${diff}d ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.dashboard-page { background: #f4f6f8; min-height: 100%; }
.lh-tight { line-height: 1.2; }
.dash-header { background: #fff; border-bottom: 1px solid #e8eaed; }

// ── KPI ───────────────────────────────────────────────────────────────────────
.kpi-card {
  background: #fff; border-radius: 12px; border: 1px solid #e8eaed;
  padding: 16px; display: flex; align-items: flex-start; gap: 14px;
  transition: box-shadow .15s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08); }
}
.kpi-icon-wrap {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  &--blue   { background: linear-gradient(135deg,#1976d2,#42a5f5); }
  &--teal   { background: linear-gradient(135deg,#00796b,#26c6da); }
  &--purple { background: linear-gradient(135deg,#6a1b9a,#ab47bc); }
  &--orange { background: linear-gradient(135deg,#e65100,#ff9800); }
}
.kpi-body { min-width: 0; }
.kpi-value { font-size: 26px; font-weight: 800; color: #1a1a2e; line-height: 1.1; }
.kpi-label { font-size: 11px; font-weight: 700; color: #78909c; margin-top: 2px; text-transform: uppercase; letter-spacing: .06em; }
.kpi-sub { font-size: 11px; color: #90a4ae; margin-top: 4px; }
.kpi-sub--green { color: #43a047; font-weight: 600; }

// ── Cards ─────────────────────────────────────────────────────────────────────
.dash-card { background: #fff; border-radius: 12px; border: 1px solid #e8eaed; padding: 20px; }
.dash-card__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 8px; }
.dash-card__title { font-size: 14px; font-weight: 700; color: #37474f; }

// ── Growth chart ──────────────────────────────────────────────────────────────
.chart-wrap { position: relative; }
.chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 180px; }
.chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; gap: 3px; }
.chart-bar-label { font-size: 10px; font-weight: 700; color: #90a4ae; text-align: center; min-height: 14px; }
.chart-bar-track {
  flex: 1; width: 100%; display: flex; align-items: flex-end;
  background: #f0f4f8; border-radius: 5px 5px 0 0; overflow: hidden;
}
.chart-bar-fill {
  width: 100%; background: linear-gradient(to top, #00796b, #4db6ac);
  border-radius: 5px 5px 0 0; transition: height .7s ease;
  &--current { background: linear-gradient(to top, #1976d2, #64b5f6); }
}
.chart-bar-month {
  font-size: 10px; color: #90a4ae; text-align: center; white-space: nowrap;
  &--current { color: #1976d2; font-weight: 700; }
}
.chart-legend { margin-top: 6px; text-align: right; }

// ── Recent leads (compact) ────────────────────────────────────────────────────
.recent-card { display: flex; flex-direction: column; }
.recent-list { display: flex; flex-direction: column; gap: 1px; overflow-y: auto; flex: 1; }
.recent-row {
  display: flex; align-items: center; gap: 8px; padding: 6px;
  border-radius: 7px; cursor: pointer; transition: background .1s;
  &:hover { background: #f0f9f8; }
}
.avatar-text { font-size: 10px; font-weight: 700; }
.recent-row__name { font-size: 12px; font-weight: 600; color: #37474f; line-height: 1.2; }
.recent-row__time { font-size: 10px; color: #b0bec5; white-space: nowrap; }

// ── Pipeline ──────────────────────────────────────────────────────────────────
.pipeline-list { display: flex; flex-direction: column; gap: 9px; }
.pipeline-row { display: grid; grid-template-columns: 100px 1fr 46px 38px; align-items: center; gap: 8px; }
.pipeline-chip { white-space: nowrap; }
.pipeline-bar-track { height: 8px; background: #f0f4f8; border-radius: 4px; overflow: hidden; }
.pipeline-bar-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }
.pipeline-row__count { font-size: 12px; font-weight: 700; color: #455a64; text-align: right; }
.pipeline-row__pct { font-size: 11px; color: #90a4ae; text-align: right; }

// ── Engagement ────────────────────────────────────────────────────────────────
.engagement-list { display: flex; flex-direction: column; gap: 12px; }
.engagement-row { display: flex; align-items: center; gap: 10px; }
.engagement-icon {
  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  &--teal   { background: #e0f2f1; color: #00796b; }
  &--purple { background: #f3e5f5; color: #7b1fa2; }
  &--green  { background: #e8f5e9; color: #2e7d32; }
}
.eng-label { font-size: 12px; font-weight: 600; color: #546e7a; }
.eng-track { height: 5px; background: #f0f4f8; border-radius: 3px; overflow: hidden; margin-top: 3px; }
.eng-fill { height: 100%; border-radius: 3px; transition: width .6s ease;
  &--teal   { background: #26a69a; }
  &--purple { background: #ab47bc; }
  &--green  { background: #66bb6a; }
}
.engagement-count { font-size: 12px; font-weight: 700; color: #455a64; white-space: nowrap; flex-shrink: 0; }

// ── Regions ───────────────────────────────────────────────────────────────────
.region-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.region-list { display: flex; flex-direction: column; gap: 7px; }
.region-row { display: flex; align-items: center; gap: 8px; }
.region-bar-wrap { flex: 1; min-width: 0; }
.region-name { font-size: 12px; color: #546e7a; font-weight: 500; margin-bottom: 2px; }
.region-track { height: 4px; background: #f0f4f8; border-radius: 2px; overflow: hidden; }
.region-fill { height: 100%; background: #80cbc4; border-radius: 2px; transition: width .6s ease; }
.region-count { font-size: 12px; font-weight: 700; color: #37474f; white-space: nowrap; flex-shrink: 0; min-width: 28px; text-align: right; }

// ── Misc ──────────────────────────────────────────────────────────────────────
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }

// ── Chips ─────────────────────────────────────────────────────────────────────
.lead-chip {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 10px; font-weight: 600; white-space: nowrap;
  &--new         { background: #eceff1; color: #546e7a; }
  &--qualified   { background: #e3f2fd; color: #1565c0; }
  &--contacted   { background: #e0f2f1; color: #00695c; }
  &--proposal    { background: #ede7f6; color: #4527a0; }
  &--negotiation { background: #fff3e0; color: #e65100; }
  &--closed_won  { background: #e8f5e9; color: #2e7d32; }
  &--closed_lost { background: #ffebee; color: #c62828; }
  &--partner     { background: #f3e5f5; color: #6a1b9a; }
}

// Tiny dot-style chips for the narrow recent leads column
.lead-dot-chip {
  display: inline-block; padding: 1px 5px; border-radius: 8px;
  font-size: 9px; font-weight: 600; white-space: nowrap;
  &--new         { background: #eceff1; color: #546e7a; }
  &--qualified   { background: #e3f2fd; color: #1565c0; }
  &--contacted   { background: #e0f2f1; color: #00695c; }
  &--proposal    { background: #ede7f6; color: #4527a0; }
  &--negotiation { background: #fff3e0; color: #e65100; }
  &--closed_won  { background: #e8f5e9; color: #2e7d32; }
  &--closed_lost { background: #ffebee; color: #c62828; }
  &--partner     { background: #f3e5f5; color: #6a1b9a; }
}
</style>
