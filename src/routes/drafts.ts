import Router from '@koa/router';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/database';
import type SqlJs from 'sql.js';

const router = new Router();

// GET /api/drafts — list all drafts
router.get('/api/drafts', async (ctx) => {
  const db = await getDb();
  const result = db.exec(`
    SELECT id, name, job_description, candidate_profile, created_at, updated_at
    FROM drafts ORDER BY updated_at DESC
  `);
  if (!result.length) { ctx.body = []; return; }
  const { columns, values } = result[0];
  ctx.body = values.map((row: SqlJs.SqlValue[]) =>
    Object.fromEntries(columns.map((col: string, i: number) => [col, row[i]]))
  );
});

// GET /api/drafts/:id — get one draft with artifacts
router.get('/api/drafts/:id', async (ctx) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM drafts WHERE id = ?`, [ctx.params.id]);
  if (!result.length || !result[0].values.length) {
    ctx.status = 404; ctx.body = { error: 'Draft not found' }; return;
  }
  const { columns, values } = result[0];
  ctx.body = Object.fromEntries(columns.map((col: string, i: number) => [col, values[0][i]]));
});

// POST /api/drafts — save a new draft
router.post('/api/drafts', async (ctx) => {
  const db = await getDb();
  const body = ctx.request.body as Record<string, string>;
  const { name, jobDescription, candidateProfile, resumeHtml, coverLetterHtml, infographicSvg } = body;

  if (!name || !jobDescription || !candidateProfile) {
    ctx.status = 400;
    ctx.body = { error: 'name, jobDescription, and candidateProfile are required' };
    return;
  }

  const now = Date.now();
  const id = uuidv4();

  db.run(`
    INSERT INTO drafts (id, name, job_description, candidate_profile, resume_html, cover_letter_html, infographic_svg, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, jobDescription, candidateProfile, resumeHtml ?? null, coverLetterHtml ?? null, infographicSvg ?? null, now, now]);

  persistDb();
  ctx.status = 201;
  ctx.body = { id };
});

// PUT /api/drafts/:id — update existing draft
router.put('/api/drafts/:id', async (ctx) => {
  const db = await getDb();
  const body = ctx.request.body as Record<string, string>;
  const { name, jobDescription, candidateProfile, resumeHtml, coverLetterHtml, infographicSvg } = body;
  const now = Date.now();

  db.run(`
    UPDATE drafts SET
      name = COALESCE(?, name),
      job_description = COALESCE(?, job_description),
      candidate_profile = COALESCE(?, candidate_profile),
      resume_html = COALESCE(?, resume_html),
      cover_letter_html = COALESCE(?, cover_letter_html),
      infographic_svg = COALESCE(?, infographic_svg),
      updated_at = ?
    WHERE id = ?
  `, [name ?? null, jobDescription ?? null, candidateProfile ?? null,
      resumeHtml ?? null, coverLetterHtml ?? null, infographicSvg ?? null,
      now, ctx.params.id]);

  persistDb();
  ctx.body = { ok: true };
});

// DELETE /api/drafts/:id — delete a draft
router.delete('/api/drafts/:id', async (ctx) => {
  const db = await getDb();
  db.run(`DELETE FROM drafts WHERE id = ?`, [ctx.params.id]);
  persistDb();
  ctx.body = { ok: true };
});

export default router;
