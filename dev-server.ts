/**
 * Local development server for dendro-crm-api.
 *
 * Imports the same Vercel handler functions used in production and
 * mounts them on a plain Express app at http://localhost:3000.
 *
 * Run with:  npm run dev
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';

// ── Lazy-import handlers (must come after dotenv is loaded) ────────────────
const { default: customerLeadsHandler }   = await import('./api/customer-leads.js');
const { default: customerLeadByIdHandler } = await import('./api/customer-leads/[id].js');
const { default: dashboardStatsHandler }  = await import('./api/dashboard/stats.js');
const { default: recentLeadsHandler }     = await import('./api/dashboard/recent-leads.js');

// ── Express setup ─────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Thin adapter: Vercel VercelRequest/Response are compatible with Express req/res at runtime
type AnyHandler = (req: unknown, res: unknown) => Promise<void> | void;

function mount(handler: AnyHandler) {
  return async (req: Request, res: Response) => {
    await handler(req, res);
  };
}

// ── Routes ────────────────────────────────────────────────────────────────
app.all('/api/customer-leads', mount(customerLeadsHandler));

app.all('/api/customer-leads/:id', async (req: Request, res: Response) => {
  // Vercel populates dynamic segments into req.query; replicate that here
  (req.query as Record<string, string>).id = req.params['id'] ?? '';
  await customerLeadByIdHandler(req, res);
});

app.get('/api/dashboard/stats',        mount(dashboardStatsHandler));
app.get('/api/dashboard/recent-leads', mount(recentLeadsHandler));

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env['PORT'] ?? 3000);
app.listen(PORT, () => {
  console.log(`[dendro-crm-api] dev server → http://localhost:${PORT}`);
});
