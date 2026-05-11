/**
 * Infrastructure — Supabase Client
 *
 * A lazily-initialised singleton so the client is created once per
 * server process and reused across requests.
 *
 * Configuration is read from environment variables — never hard-coded.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // service-role for server-side

  if (!url || !key) {
    throw new Error(
      'Missing Supabase configuration. ' +
        'Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.',
    );
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: false, // server-side: no session persistence
      autoRefreshToken: false,
    },
  });

  return _client;
}
