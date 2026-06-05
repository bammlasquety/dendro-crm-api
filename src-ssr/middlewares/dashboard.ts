/**
 * Quasar SSR Middleware — Dashboard API
 * Location: src-ssr/middlewares/dashboard.ts
 *
 * Strategy: Supabase default row limit is 1000. With 14k+ leads we must NOT
 * use bulk select('*'). Instead we use:
 *   • HEAD count queries  (count: 'exact', head: true) for all KPI numbers — zero row data transfer
 *   • Paginated batches   for aggregations that need per-row values (region, deal value, monthly growth)
 *   • All queries fire in parallel via Promise.all for speed
 */

import { ssrMiddleware } from 'quasar/wrappers';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

function getSupabase() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const supabase = getSupabase();

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH = 1000; // Supabase default page size

const STAGES = [
  'new', 'qualified', 'contacted', 'proposal',
  'negotiation', 'closed_won', 'closed_lost', 'partner',
] as const;

// ─── UTC date helpers ─────────────────────────────────────────────────────────

function yearMonthUTC(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Returns { ym, start (inclusive ISO), end (exclusive ISO), label } for last n UTC months */
function lastNMonthsUTC(n: number) {
  const now  = new Date();
  const base = now.getUTCFullYear() * 12 + now.getUTCMonth();

  return Array.from({ length: n }, (_, i) => {
    const total = base - (n - 1 - i);
    const y  = Math.floor(total / 12);
    const mo = (total % 12) + 1;
    const ym = `${y}-${String(mo).padStart(2, '0')}`;

    const startDate = new Date(Date.UTC(y, mo - 1, 1));
    const endDate   = new Date(Date.UTC(y, mo, 1));     // first day of next month

    const label = startDate.toLocaleDateString('en-PH', {
      month: 'short', year: '2-digit', timeZone: 'UTC',
    });

    return { ym, start: startDate.toISOString(), end: endDate.toISOString(), label };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Run a HEAD count query and return the count (0 on error). */
async function headCount(
  query: ReturnType<typeof supabase.from>
): Promise<number> {
  const { count, error } = await (query as ReturnType<ReturnType<typeof supabase.from>['select']>);
  if (error) console.warn('[headCount] error:', error.message);
  return count ?? 0;
}

interface AggRow {
  region: string | null;
  potential_deal_value_php: number | null;
  created_at: string;
}

/**
 * Fetch every row's aggregation columns across all pages in parallel.
 * Uses the pre-fetched total so page count is known up front.
 */
async function fetchAllAggRows(total: number): Promise<AggRow[]> {
  const pages = Math.ceil(total / BATCH);
  const batches = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      supabase
        .from('customer_leads')
        .select('region, potential_deal_value_php, created_at')
        .range(i * BATCH, (i + 1) * BATCH - 1)
    )
  );
  return batches.flatMap(b => (b.data ?? []) as AggRow[]);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default ssrMiddleware(({ app }) => {

  // ── GET /api/dashboard/stats ──────────────────────────────────────────────

  app.get('/api/dashboard/stats', async (_req, res) => {
    try {
      const now  = new Date();
      const d30  = new Date(now.getTime() -  30 * 86_400_000).toISOString();
      const d90  = new Date(now.getTime() -  90 * 86_400_000).toISOString();
      const thisMonthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      ).toISOString();

      const months = lastNMonthsUTC(12);

      // ── Step 1: get total so we know how many batch pages are needed ──────

      const { count: totalRaw, error: totalErr } = await supabase
        .from('customer_leads')
        .select('*', { count: 'exact', head: true });

      if (totalErr) throw totalErr;
      const total = totalRaw ?? 0;

      // ── Step 2: fire all queries in parallel ──────────────────────────────

      const [
        active,
        inactive,
        newThisMonth,
        newLast30,
        newLast90,
        webinarOptIn,
        webinarAttended,
        newsletterOptIn,
        ...rest
      ] = await Promise.all([
        // KPI counts — HEAD only, no rows transferred
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('status', 'active')),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('status', 'inactive')),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart)),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', d30)),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', d90)),

        // Engagement counts
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('optin_webinar', true)),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('webinar_attended', true)),
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('optin_newsletter', true)),

        // Stage counts (8 queries)
        ...STAGES.map(s =>
          headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('lead_status', s))
        ),

        // Monthly growth counts (12 queries)
        ...months.map(({ start, end }) =>
          headCount(
            supabase.from('customer_leads')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', start)
              .lt('created_at', end)
          )
        ),

        // Paginated batch for region + deal value aggregation
        fetchAllAggRows(total),
      ] as const);

      // ── Step 3: unpack rest ───────────────────────────────────────────────

      const stageCounts  = (rest as number[]).slice(0, STAGES.length);
      const monthCounts  = (rest as number[]).slice(STAGES.length, STAGES.length + 12);
      const aggRows      = rest[STAGES.length + 12] as AggRow[];

      // ── Step 4: compute aggregations from batch rows ──────────────────────

      // Deal value sum
      const totalDealValuePhp = aggRows.reduce(
        (sum, r) => sum + (r.potential_deal_value_php ?? 0), 0
      );

      // Stage breakdown
      const byStage: Record<string, number> = Object.fromEntries(
        STAGES.map((s, i) => [s, stageCounts[i] ?? 0])
      );

      // Region breakdown (top 8)
      const regionMap: Record<string, number> = {};
      for (const r of aggRows) {
        if (r.region) regionMap[r.region] = (regionMap[r.region] ?? 0) + 1;
      }
      const byRegion = Object.entries(regionMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([region, count]) => ({ region, count }));

      // Monthly growth
      const monthlyGrowth = months.map(({ ym, label }, i) => ({
        month: ym,
        label,
        count: monthCounts[i] ?? 0,
      }));

      res.json({
        success: true,
        stats: {
          total,
          active,
          inactive,
          newThisMonth,
          newLast30,
          newLast90,
          totalDealValuePhp,
          webinarOptIn,
          webinarAttended,
          newsletterOptIn,
          byStage,
          byRegion,
          monthlyGrowth,
        },
      });
    } catch (err) {
      console.error('[GET /api/dashboard/stats]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats.' });
    }
  });

  // ── GET /api/dashboard/recent-leads ──────────────────────────────────────

  app.get('/api/dashboard/recent-leads', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('customer_leads')
        .select('id, name, email, job_title, lead_status, status, region, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      res.json({ success: true, leads: data ?? [] });
    } catch (err) {
      console.error('[GET /api/dashboard/recent-leads]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch recent leads.' });
    }
  });

});
