/**
 * Authorization for the dendro-crm-api.
 *
 * Before this existed, every lead endpoint ran on the Supabase service-role
 * key with no caller check at all — which meant the service key's RLS bypass
 * was effectively exposed to the open internet. The database was never the
 * problem: public.customer_leads has RLS on with an is_crm_staff() policy. The
 * API was simply walking around it on behalf of anyone who asked.
 *
 * Note on why "a valid Supabase JWT" is not sufficient here. The CRM and the
 * Partner Hub share one Supabase project, so partners hold perfectly valid
 * tokens for the same auth server. Checking only `getUser(token)` would let any
 * onboarded partner read the entire lead database. Membership of
 * public.crm_staff is the actual gate, mirroring is_crm_staff() in Postgres.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './supabase';

export interface CrmStaff {
  user_id: string;
  full_name: string;
  title: string | null;
  role: 'admin' | 'csr';
  active: boolean;
}

function bearer(req: VercelRequest): string | null {
  const raw = req.headers.authorization ?? '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 ? token : null;
}

/**
 * Resolve the caller to an active CRM staff member.
 *
 * On failure this writes the response itself and returns null, so handlers can
 * simply do:
 *
 *   const staff = await requireCrmStaff(req, res);
 *   if (!staff) return;
 *
 * 401 means "no usable session" — the CRM will refresh and retry once.
 * 403 means "we know who you are, and it isn't staff" — the CRM keeps the
 * session and shows the reason rather than bouncing the user to /login.
 */
export async function requireCrmStaff(
  req: VercelRequest,
  res: VercelResponse,
): Promise<CrmStaff | null> {
  const token = bearer(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return null;
  }

  const supabase = getSupabase();

  let userId: string;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Session expired or invalid.' });
      return null;
    }
    userId = data.user.id;
  } catch (err) {
    // A thrown error here is an outage talking to Supabase, not a bad token.
    // Failing closed is the right call for an endpoint over personal data.
    console.error('[auth] token verification failed:', err);
    res.status(503).json({ success: false, error: 'Could not verify your session. Try again.' });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('crm_staff')
      .select('user_id, full_name, title, role, active')
      .eq('user_id', userId)
      .maybeSingle<CrmStaff>();

    if (error) throw error;

    if (!data || !data.active) {
      res.status(403).json({
        success: false,
        error: 'This account does not have CRM access. Contact a Dendrotonics administrator.',
      });
      return null;
    }

    return data;
  } catch (err) {
    console.error('[auth] crm_staff lookup failed:', err);
    res.status(503).json({ success: false, error: 'Could not verify your access. Try again.' });
    return null;
  }
}

/**
 * Stricter variant for destructive operations. Mirrors is_crm_admin() in
 * Postgres, which already guards crm_delete_partner() and friends.
 *
 * Not currently wired to any endpoint — deletes on customer_leads are open to
 * all staff today and tightening that would be a behaviour change, not a
 * security fix. Here for when you want it.
 */
export async function requireCrmAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<CrmStaff | null> {
  const staff = await requireCrmStaff(req, res);
  if (!staff) return null;

  if (staff.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Only a Dendrotonics administrator may perform this action.',
    });
    return null;
  }

  return staff;
}
