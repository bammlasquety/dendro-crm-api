/**
 * Vercel Serverless Function — /api/dashboard/stats
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';

const STAGES = [
  'new', 'qualified', 'contacted', 'proposal',
  'negotiation', 'closed_won', 'closed_lost', 'partner',
] as const;

const BATCH = 1000;

function lastNMonthsUTC(n: number) {
  const now  = new Date();
  const base = now.getUTCFullYear() * 12 + now.getUTCMonth();

  return Array.from({ length: n }, (_, i) => {
    const total = base - (n - 1 - i);
    const y  = Math.floor(total / 12);
    const mo = (total % 12) + 1;
    const ym = `${y}-${String(mo).padStart(2, '0')}`;
    const startDate = new Date(Date.UTC(y, mo - 1, 1));
    const endDate   = new Date(Date.UTC(y, mo, 1));
    const label = startDate.toLocaleDateString('en-PH', {
      month: 'short', year: '2-digit', timeZone: 'UTC',
    });
    return { ym, start: startDate.toISOString(), end: endDate.toISOString(), label };
  });
}

type HeadCountQuery = PromiseLike<{ count: number | null; error: { message: string } | null }>;
async function headCount(query: HeadCountQuery): Promise<number> {
  const { count, error } = await query;
  if (error) console.warn('[headCount] error:', error.message);
  return count ?? 0;
}

interface AggRow {
  region: string | null;
  potential_deal_value_php: number | null;
  created_at: string;
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ success: false, error: 'Method not allowed.' }); return; }

  try {
    const supabase = getSupabase();
    const now  = new Date();
    const d30  = new Date(now.getTime() -  30 * 86_400_000).toISOString();
    const d90  = new Date(now.getTime() -  90 * 86_400_000).toISOString();
    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const months = lastNMonthsUTC(12);

    // Step 1: total count
    const { count: totalRaw, error: totalErr } = await supabase
      .from('customer_leads')
      .select('*', { count: 'exact', head: true });
    if (totalErr) throw totalErr;
    const total = totalRaw ?? 0;

    // Step 2: fetch all agg rows for region/deal-value in parallel batches
    const pages = Math.ceil(total / BATCH);
    const aggBatches = await Promise.all(
      Array.from({ length: pages }, (_, i) =>
        supabase
          .from('customer_leads')
          .select('region, potential_deal_value_php, created_at')
          .range(i * BATCH, (i + 1) * BATCH - 1)
      )
    );
    const aggRows: AggRow[] = aggBatches.flatMap(b => (b.data ?? []) as AggRow[]);

    // Step 3: fire all count queries in parallel
    const [
      active, inactive,
      newThisMonth, newLast30, newLast90,
      webinarOptIn, webinarAttended, newsletterOptIn,
      ...stageCounts
    ] = await Promise.all([
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('status', 'active')),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('status', 'inactive')),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart)),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', d30)),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', d90)),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('optin_webinar', true)),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('webinar_attended', true)),
      headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('optin_newsletter', true)),
      ...STAGES.map(s =>
        headCount(supabase.from('customer_leads').select('*', { count: 'exact', head: true }).eq('lead_status', s))
      ),
      ...months.map(({ start, end }) =>
        headCount(
          supabase.from('customer_leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lt('created_at', end)
        )
      ),
    ] as const);

    const stageCountArr  = (stageCounts as number[]).slice(0, STAGES.length);
    const monthCountArr  = (stageCounts as number[]).slice(STAGES.length);

    // Aggregations from batch rows
    const totalDealValuePhp = aggRows.reduce((sum, r) => sum + (r.potential_deal_value_php ?? 0), 0);

    const byStage: Record<string, number> = Object.fromEntries(
      STAGES.map((s, i) => [s, stageCountArr[i] ?? 0])
    );

    const regionMap: Record<string, number> = {};
    for (const r of aggRows) {
      if (r.region) regionMap[r.region] = (regionMap[r.region] ?? 0) + 1;
    }
    const byRegion = Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([region, count]) => ({ region, count }));

    const monthlyGrowth = months.map(({ ym, label }, i) => ({
      month: ym,
      label,
      count: monthCountArr[i] ?? 0,
    }));

    res.status(200).json({
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
}
