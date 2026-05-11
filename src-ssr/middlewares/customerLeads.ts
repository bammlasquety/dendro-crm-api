/**
 * Quasar SSR Middleware — Customer Leads API
 * Location: src-ssr/middlewares/customerLeads.ts
 */

import { ssrMiddleware } from 'quasar/wrappers';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env explicitly — process.env is not populated in SSR middleware
// by Quasar's build pipeline
config();

function getSupabase() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  console.log('[customerLeads] SUPABASE_URL:', url ?? 'MISSING');
  console.log('[customerLeads] SERVICE_ROLE_KEY set:', !!key);

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabase = getSupabase();

export default ssrMiddleware(({ app }) => {
  // GET /api/customer-leads
  app.get('/api/customer-leads', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query['page']) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 25));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
      const leadStatus =
        typeof req.query['leadStatus'] === 'string' ? req.query['leadStatus'] : undefined;
      const region = typeof req.query['region'] === 'string' ? req.query['region'] : undefined;
      const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

      let query = supabase
        .from('customer_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) query = query.eq('status', status);
      if (leadStatus) query = query.eq('lead_status', leadStatus);
      if (region) query = query.ilike('region', `%${region}%`);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
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
  });

  // GET /api/customer-leads/:id
  app.get('/api/customer-leads/:id', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('customer_leads')
        .select('*')
        .eq('id', req.params['id'])
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ success: false, error: 'Customer lead not found.' });
        return;
      }

      res.json({ success: true, lead: data });
    } catch (err) {
      console.error('[GET /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch customer lead.' });
    }
  });

  // DELETE /api/customer-leads/:id
  app.delete('/api/customer-leads/:id', async (req, res) => {
    try {
      const { error } = await supabase.from('customer_leads').delete().eq('id', req.params['id']);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('[DELETE /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to delete customer lead.' });
    }
  });

  // PATCH /api/customer-leads/:id
  app.patch('/api/customer-leads/:id', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('customer_leads')
        .update(req.body)
        .eq('id', req.params['id'])
        .select()
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, lead: data });
    } catch (err) {
      console.error('[PATCH /api/customer-leads/:id]', err);
      res.status(500).json({ success: false, error: 'Failed to update customer lead.' });
    }
  });
});
