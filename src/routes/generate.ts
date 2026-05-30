import Router from '@koa/router';
import { createLlmBackend } from '../llm/factory';
import { buildPrompt } from '../pipeline/buildPrompt';
import { callLlm } from '../pipeline/callLlm';
import { parseResponse } from '../pipeline/parseResponse';
import { generateArtifacts } from '../pipeline/generateArtifacts';
import { htmlToPdf } from '../utils/htmlToPdf';
import type { InfographicData } from '../pipeline/parseResponse';

const router = new Router();
const backend = createLlmBackend();

router.post('/api/generate', async (ctx) => {
  const { jobDescription, candidateProfile } = ctx.request.body as Record<string, string>;

  if (!jobDescription || !candidateProfile) {
    ctx.status = 400;
    ctx.body = { error: 'jobDescription and candidateProfile are required' };
    return;
  }

  // Pipes-and-Filters pipeline
  const prompts = buildPrompt({ jobDescription, candidateProfile });
  const raw = await callLlm(prompts, backend);
  const structured = parseResponse(raw);
  const artifacts = generateArtifacts(structured);

  // Generate PDFs in parallel
  const [resumePdfBuffer, coverLetterPdfBuffer] = await Promise.all([
    htmlToPdf(artifacts.resumeHtml),
    htmlToPdf(artifacts.coverLetterHtml),
  ]);

  ctx.body = {
    resumeHtml: artifacts.resumeHtml,
    coverLetterHtml: artifacts.coverLetterHtml,
    infographicSvg: artifacts.infographicSvg,
    infographicData: structured.infographic,   // expose structured data for editing
    resumePdfBase64: resumePdfBuffer.toString('base64'),
    coverLetterPdfBase64: coverLetterPdfBuffer.toString('base64'),
  };
});

// Re-render SVG from edited infographic data — no LLM call needed
router.post('/api/render-svg', async (ctx) => {
  const data = ctx.request.body as InfographicData;
  if (!data || !data.companyName) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid infographic data' };
    return;
  }
  const { infographicSvg } = generateArtifacts({
    resumeHtml: '',
    coverLetterHtml: '',
    infographic: data,
  });
  ctx.body = { infographicSvg };
});

export default router;
