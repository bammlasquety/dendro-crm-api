/**
 * Shared HTTP concerns for every endpoint in this API.
 *
 * The important detail here is `Authorization` in Access-Control-Allow-Headers.
 * The CRM now sends a Bearer token on every request, which makes these calls
 * "non-simple" and triggers a CORS preflight. The old headers only allowed
 * Content-Type, so without this the browser would reject every request before
 * it ever reached the function — the API would look broken rather than secure.
 */

import type { VercelResponse } from '@vercel/node';

/**
 * Comma-separated allow-list, e.g.
 *   ALLOWED_ORIGINS=https://crm.dendrotonics.com,http://localhost:9000
 *
 * Left unset it falls back to '*', which is what this API did before. That is
 * not a hole on its own — authorization is the Bearer token, not the origin,
 * and '*' cannot be combined with cookie credentials anyway — but setting it
 * closes off casual cross-site use of the endpoints and is worth doing.
 */
function allowedOrigins(): string[] {
  return (process.env['ALLOWED_ORIGINS'] ?? process.env['ALLOWED_ORIGIN'] ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function cors(res: VercelResponse, methods: string, origin?: string | undefined): void {
  const list = allowedOrigins();

  if (list.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && list.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Caches must not serve one origin's response to another.
    res.setHeader('Vary', 'Origin');
  } else {
    // Unrecognised origin: omit the header entirely so the browser blocks it.
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', `${methods},OPTIONS`);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Lead records carry per-lead secrets used to build email links. They must
 * never leave the server: anyone holding one can mark a lead verified or
 * unsubscribe them without logging in.
 *
 * This is a denylist rather than a select() allow-list on purpose — the CRM
 * reads a wide spread of columns and an allow-list would silently drop fields
 * as the schema grows. Revisit if the column set ever settles down.
 */
const SECRET_COLUMNS = ['verify_token', 'unsub_token'] as const;

export function stripSecrets<T>(row: T): T;
export function stripSecrets<T>(rows: T[]): T[];
export function stripSecrets(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((r) => stripSecrets(r));
  if (input && typeof input === 'object') {
    const copy = { ...(input as Record<string, unknown>) };
    for (const col of SECRET_COLUMNS) delete copy[col];
    return copy;
  }
  return input;
}
