/**
 * Local development server for dendro-crm-api.
 * Run with: npm run dev
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import customerLeadsHandler from './api/customer-leads';
import customerLeadByIdHandler from './api/customer-leads/[id]';
import dashboardStatsHandler from './api/dashboard/stats';
import recentLeadsHandler from './api/dashboard/recent-leads';
import generateArticleHandler from './api/generate-article';
import revalidateBlogHandler from './api/revalidate-blog';

const app = express();
app.use(express.json());

type AnyHandler = (req: unknown, res: unknown) => Promise<void> | void;

function mount(handler: AnyHandler) {
  return async (req: Request, res: Response) => {
    await handler(req, res);
  };
}

app.all('/api/customer-leads', mount(customerLeadsHandler));

app.all('/api/customer-leads/:id', async (req: Request, res: Response) => {
  (req.query as Record<string, string>)['id'] = req.params['id'] ?? '';
  await customerLeadByIdHandler(req, res);
});

app.get('/api/dashboard/stats',        mount(dashboardStatsHandler));
app.get('/api/dashboard/recent-leads', mount(recentLeadsHandler));

app.all('/api/generate-article', mount(generateArticleHandler));
app.all('/api/revalidate-blog',  mount(revalidateBlogHandler));

const PORT = Number(process.env['PORT'] ?? 3000);
app.listen(PORT, () => {
  console.log(`[dendro-crm-api] dev server → http://localhost:${PORT}`);
});
