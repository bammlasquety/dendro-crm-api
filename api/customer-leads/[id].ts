/**
 * Vercel Serverless Function — /api/customer-leads/:id
 * Handles GET (single), PATCH (update), DELETE
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/supabase';

const PATCHABLE_COLUMNS = [
  'name', 'email', 'contact_number', 'job_title', 'farm_location', 'region',
  'status', 'lead_status', 'label', 'webinar_attended', 'webinar_date_attended',
  'optin_newsletter', 'optin_webinar', 'potential_deal_value_php', 'notes', 'farm_notes',
] as const;

type PatchableColumn = (typeof PATCHABLE_COLUMNS)[number];

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const id = req.query['id'] as string;
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing id.' });
    return;
  }

  const supabase = getSupabase();

  // ── GET /api/customer-leads/:id ──────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('customer_leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ success: false, error: 'Customer lead not found.' });
        return;
      }
      res.status(200).json({ success: true, lead: data });
    } catch (err) {
      console.error('[GET /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch customer lead.' });
    }
    return;
  }

  // ── PATCH /api/customer-leads/:id ────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const body = req.body as Record<string, unknown>;
      const patch: Partial<Record<PatchableColumn, unknown>> = {};
      for (const col of PATCHABLE_COLUMNS) {
        if (col in body) patch[col] = body[col];
      }

      // When a lead is marked as having attended a webinar, auto-stamp the
      // attendance date with today if one wasn't explicitly provided.
      if (patch['webinar_attended'] === true && !patch['webinar_date_attended']) {
        patch['webinar_date_attended'] = new Date().toISOString().slice(0, 10);
      }

      if (Object.keys(patch).length === 0) {
        res.status(400).json({ success: false, error: 'No patchable fields provided.' });
        return;
      }

      const { data, error } = await supabase
        .from('customer_leads')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ success: false, error: 'Customer lead not found.' });
        return;
      }
      res.status(200).json({ success: true, lead: data });
    } catch (err) {
      console.error('[PATCH /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to update customer lead.' });
    }
    return;
  }

  // ── DELETE /api/customer-leads/:id ───────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('customer_leads').delete().eq('id', id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('[DELETE /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to delete customer lead.' });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}
