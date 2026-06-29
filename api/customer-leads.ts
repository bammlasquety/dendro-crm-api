/**
 * Vercel Serverless Function — /api/customer-leads
 * Handles GET (list) and POST (create)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/supabase';

const VALID_STATUSES = ['active', 'inactive'] as const;
const VALID_LEAD_STATUSES = [
  'new', 'web', 'joined', 'qualified', 'contacted', 'proposal',
  'negotiation', 'closed_won', 'closed_lost', 'partner',
] as const;

const PATCHABLE_COLUMNS = [
  'name', 'email', 'contact_number', 'job_title', 'farm_location', 'region',
  'status', 'lead_status', 'label', 'webinar_attended', 'webinar_date_attended',
  'optin_newsletter', 'optin_webinar', 'potential_deal_value_php', 'notes', 'farm_notes',
] as const;

type PatchableColumn = (typeof PATCHABLE_COLUMNS)[number];

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const supabase = getSupabase();

  // ── GET /api/customer-leads ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const page = Math.max(1, Number(req.query['page']) || 1);
      const limit = Math.min(1000, Math.max(1, Number(req.query['limit']) || 25));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
      const leadStatus = typeof req.query['leadStatus'] === 'string' ? req.query['leadStatus'] : undefined;
      const region = typeof req.query['region'] === 'string' ? req.query['region'] : undefined;
      const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

      let query = supabase
        .from('customer_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status && (VALID_STATUSES as readonly string[]).includes(status))
        query = query.eq('status', status);
      if (leadStatus && (VALID_LEAD_STATUSES as readonly string[]).includes(leadStatus))
        query = query.eq('lead_status', leadStatus);
      if (region) query = query.ilike('region', `%${region}%`);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      res.status(200).json({
        success: true,
        leads: data ?? [],
        pagination: {
          total: count ?? 0,
          page,
          limit,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      });
    } catch (err) {
      console.error('[GET /api/customer-leads]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch customer leads.' });
    }
    return;
  }

  // ── POST /api/customer-leads ─────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body as Record<string, unknown>;

      const name  = typeof body['name']  === 'string' ? body['name'].trim()  : '';
      const email = typeof body['email'] === 'string' ? body['email'].trim() : '';

      if (!name)  { res.status(400).json({ success: false, error: 'name is required.' });  return; }
      if (!email) { res.status(400).json({ success: false, error: 'email is required.' }); return; }

      const insert: Partial<Record<PatchableColumn, unknown>> & { name: string; email: string } = { name, email };
      for (const col of PATCHABLE_COLUMNS) {
        if (col === 'name' || col === 'email') continue;
        if (col in body) insert[col] = body[col];
      }

      // Auto-stamp attendance date with today when marked attended without a date.
      if (insert['webinar_attended'] === true && !insert['webinar_date_attended']) {
        insert['webinar_date_attended'] = new Date().toISOString().slice(0, 10);
      }

      const { data, error } = await supabase
        .from('customer_leads')
        .insert(insert)
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          res.status(409).json({ success: false, error: 'A lead with that email already exists.' });
          return;
        }
        throw error;
      }

      res.status(201).json({ success: true, lead: data });
    } catch (err) {
      console.error('[POST /api/customer-leads]', err);
      res.status(500).json({ success: false, error: 'Failed to create customer lead.' });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}
