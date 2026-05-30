import Router from '@koa/router';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

const router = new Router();

// GET /api/drafts — list all drafts
router.get('/api/drafts', (ctx) => {
  const db = getDb();
  const drafts = db.prepare(`
    SELECT id, name, job_description, candidate_profile, created_at, updated_at
    FROM drafts ORDER BY updated_at DESC
  `).all();
  ctx.body = drafts;
});

// GET /api/drafts/:id — get one draft with artifacts
router.get('/api/drafts/:id', (ctx) => {
  const db = getDb();
  const draft = db.prepare('SELECT * FROM drafts WHERE id = ?').get(ctx.params.id);
  if (!draft) {
    ctx.status = 404;
    ctx.body = { error: 'Draft not found' };
    return;
  }
  ctx.body = draft;
});

// POST /api/drafts — save a new draft
router.post('/api/drafts', (ctx) => {
  const db = getDb();
  const body = ctx.request.body as Record<string, string>;
  const { name, jobDescription, candidateProfile, resumeHtml, coverLetterHtml, infographicSvg } = body;

  if (!name || !jobDescription || !candidateProfile) {
    ctx.status = 400;
    ctx.body = { error: 'name, jobDescription, and candidateProfile are required' };
    return;
  }

  const now = Date.now();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO drafts (id, name, job_description, candidate_profile, resume_html, cover_letter_html, infographic_svg, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, jobDescription, candidateProfile, resumeHtml ?? null, coverLetterHtml ?? null, infographicSvg ?? null, now, now);

  ctx.status = 201;
  ctx.body = { id };
});

// PUT /api/drafts/:id — update existing draft
router.put('/api/drafts/:id', (ctx) => {
  const db = getDb();
  const body = ctx.request.body as Record<string, string>;
  const { name, jobDescription, candidateProfile, resumeHtml, coverLetterHtml, infographicSvg } = body;
  const now = Date.now();

  const result = db.prepare(`
    UPDATE drafts SET
      name = COALESCE(?, name),
      job_description = COALESCE(?, job_description),
      candidate_profile = COALESCE(?, candidate_profile),
      resume_html = COALESCE(?, resume_html),
      cover_letter_html = COALESCE(?, cover_letter_html),
      infographic_svg = COALESCE(?, infographic_svg),
      updated_at = ?
    WHERE id = ?
  `).run(name ?? null, jobDescription ?? null, candidateProfile ?? null,
         resumeHtml ?? null, coverLetterHtml ?? null, infographicSvg ?? null,
         now, ctx.params.id);

  if (result.changes === 0) {
    ctx.status = 404;
    ctx.body = { error: 'Draft not found' };
    return;
  }
  ctx.body = { ok: true };
});

// DELETE /api/drafts/:id — delete a draft
router.delete('/api/drafts/:id', (ctx) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM drafts WHERE id = ?').run(ctx.params.id);
  if (result.changes === 0) {
    ctx.status = 404;
    ctx.body = { error: 'Draft not found' };
    return;
  }
  ctx.body = { ok: true };
});

export default router;
