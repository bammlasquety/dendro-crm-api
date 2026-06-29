/**
 * Vercel Serverless Function — /api/revalidate-blog
 *
 * Called by the CRM after an article is published, to refresh the public
 * dendrov4 blog immediately. Verifies the caller's Supabase session, then
 * forwards the request to dendrov4's /api/revalidate with the shared secret
 * (so the secret never reaches the browser).
 *
 * Required env vars:
 *   SUPABASE_URL                - already set (verifies the JWT)
 *   SUPABASE_SERVICE_ROLE_KEY   - already set
 *   DENDROV4_REVALIDATE_URL     - e.g. https://www.dendrotonics.com/api/revalidate
 *   REVALIDATE_SECRET           - shared secret, matches dendrov4's env
 *   ALLOWED_ORIGIN              - optional, defaults to "*"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/supabase';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env['ALLOWED_ORIGIN'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function isAuthed(authHeader: string | undefined): Promise<boolean> {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    return !error && !!data.user;
  } catch (err) {
    console.error('[revalidate-blog] auth check failed:', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  if (!(await isAuthed(req.headers.authorization))) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const target = process.env['DENDROV4_REVALIDATE_URL'];
  const secret = process.env['REVALIDATE_SECRET'];
  if (!target || !secret) {
    res.status(500).json({ success: false, error: 'Revalidation not configured.' });
    return;
  }

  const slug = (req.body && typeof req.body === 'object' ? (req.body as { slug?: string }).slug : undefined) ?? null;

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ slug }),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[revalidate-blog] upstream error:', upstream.status, text);
      res.status(502).json({ success: false, error: 'Revalidation failed upstream.' });
      return;
    }
    res.status(200).json({ success: true, slug });
  } catch (err) {
    console.error('[revalidate-blog] failed:', err);
    res.status(500).json({ success: false, error: 'Internal error.' });
  }
}
