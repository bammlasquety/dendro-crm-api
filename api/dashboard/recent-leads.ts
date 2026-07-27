/**
 * Vercel Serverless Function — /api/dashboard/recent-leads
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';
import { requireCrmStaff } from '../_lib/auth';
import { cors } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res, 'GET', req.headers.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ success: false, error: 'Method not allowed.' }); return; }

  // Returns names and emails of the ten newest leads — staff-only.
  const staff = await requireCrmStaff(req, res);
  if (!staff) return;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('customer_leads')
      .select('id, name, email, job_title, lead_status, status, region, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.status(200).json({ success: true, leads: data ?? [] });
  } catch (err) {
    console.error('[GET /api/dashboard/recent-leads]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch recent leads.' });
  }
}
