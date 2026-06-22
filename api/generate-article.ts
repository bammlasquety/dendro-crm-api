/**
 * Vercel Serverless Function — /api/generate-article
 *
 * Powers the "Write with AI" panel in the CRM article editor. Keeps the
 * OpenAI key server-side, verifies the caller's Supabase session, and
 * returns generated Markdown (or suggested metadata).
 *
 * Required env vars:
 *   OPENAI_API_KEY              - OpenAI secret key (server only)
 *   SUPABASE_URL                - already set (used to verify the JWT)
 *   SUPABASE_SERVICE_ROLE_KEY   - already set
 *   OPENAI_MODEL                - optional, defaults to "gpt-4o-mini"
 *   ALLOWED_ORIGIN              - optional, defaults to "*"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/supabase';

type Mode = 'draft' | 'improve' | 'continue' | 'metadata';

interface Body {
  mode?: Mode;
  instruction?: string;
  title?: string;
  description?: string;
  body?: string;
}

const MODEL = process.env['OPENAI_MODEL'] || 'gpt-4o-mini';

const BRAND_CONTEXT = `You are the content writer for Dendrotonics Corporation, a Filipino
agroforestry + technology company focused on sustainable agarwood cultivation, native-tree
reforestation, and AI-driven forestry. Tone: confident, inspiring, credible, professional but
warm. Audience: investors, landowners, and environmental advocates. Write in clean Markdown
using ## subheadings, short paragraphs, and the occasional blockquote. Do NOT include YAML
frontmatter or an H1 title — only the article body.`;

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env['ALLOWED_ORIGIN'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function buildMessages(b: Body): { role: 'system' | 'user'; content: string }[] {
  const ctx = b.title ? `\n\nCurrent title: "${b.title}".` : '';
  switch (b.mode) {
    case 'improve':
      return [
        { role: 'system', content: BRAND_CONTEXT },
        {
          role: 'user',
          content:
            `Improve and polish the following article. Fix grammar, tighten prose, improve flow and ` +
            `structure, keep the meaning and Markdown formatting. Return only the revised Markdown.` +
            (b.instruction ? `\n\nExtra guidance: ${b.instruction}` : '') +
            `\n\n---\n${b.body ?? ''}`,
        },
      ];
    case 'continue':
      return [
        { role: 'system', content: BRAND_CONTEXT },
        {
          role: 'user',
          content:
            `Continue writing this article from where it stops. Match the voice and add 2-4 more ` +
            `paragraphs (with a subheading if natural). Return only the NEW Markdown to append.` +
            (b.instruction ? `\n\nDirection: ${b.instruction}` : '') +
            `\n\n---\n${b.body ?? ''}`,
        },
      ];
    case 'metadata':
      return [
        { role: 'system', content: BRAND_CONTEXT },
        {
          role: 'user',
          content:
            `Based on the article below, produce JSON with keys "title" (compelling, < 70 chars), ` +
            `"description" (1 sentence, < 160 chars), and "tags" (array of 3-6 lowercase keywords). ` +
            `Return ONLY JSON.\n\n---\n${b.body ?? ''}`,
        },
      ];
    case 'draft':
    default:
      return [
        { role: 'system', content: BRAND_CONTEXT },
        {
          role: 'user',
          content: `Write a complete, publish-ready article in Markdown about:\n\n${b.instruction ?? ''}${ctx}`,
        },
      ];
  }
}

async function isAuthed(authHeader: string | undefined): Promise<boolean> {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    return !error && !!data.user;
  } catch (err) {
    console.error('[generate-article] auth check failed:', err);
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

  if (!process.env['OPENAI_API_KEY']) {
    res.status(500).json({ success: false, error: 'OPENAI_API_KEY not configured.' });
    return;
  }

  // Only signed-in CRM users may spend OpenAI tokens.
  if (!(await isAuthed(req.headers.authorization))) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const body = (req.body ?? {}) as Body;
  const mode: Mode = body.mode ?? 'draft';
  if (mode === 'draft' && !body.instruction?.trim()) {
    res.status(400).json({ success: false, error: 'instruction is required for draft.' });
    return;
  }

  const isMetadata = mode === 'metadata';

  try {
    const oa = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: isMetadata ? 0.4 : 0.8,
        messages: buildMessages({ ...body, mode }),
        ...(isMetadata ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!oa.ok) {
      const text = await oa.text();
      console.error('[generate-article] OpenAI error:', oa.status, text);
      res.status(502).json({ success: false, error: 'OpenAI request failed.' });
      return;
    }

    const json = (await oa.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? '';

    if (isMetadata) {
      try {
        const parsed = JSON.parse(content) as {
          title?: string;
          description?: string;
          tags?: string[];
        };
        res.status(200).json(parsed);
      } catch {
        res.status(200).json({ description: content });
      }
      return;
    }

    res.status(200).json({ content });
  } catch (err) {
    console.error('[generate-article] failed:', err);
    res.status(500).json({ success: false, error: 'Internal error.' });
  }
}
