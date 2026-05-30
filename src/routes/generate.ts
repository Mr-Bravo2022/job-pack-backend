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

  // Generate PDFs — fail gracefully if puppeteer is unavailable on this host
  let resumePdfBase64: string | null = null;
  let coverLetterPdfBase64: string | null = null;
  try {
    const [resumePdfBuffer, coverLetterPdfBuffer] = await Promise.all([
      htmlToPdf(artifacts.resumeHtml),
      htmlToPdf(artifacts.coverLetterHtml),
    ]);
    resumePdfBase64 = resumePdfBuffer.toString('base64');
    coverLetterPdfBase64 = coverLetterPdfBuffer.toString('base64');
  } catch (pdfErr) {
    console.warn('PDF generation unavailable:', (pdfErr as Error).message);
  }

  ctx.body = {
    resumeHtml: artifacts.resumeHtml,
    coverLetterHtml: artifacts.coverLetterHtml,
    infographicSvg: artifacts.infographicSvg,
    infographicData: structured.infographic,
    resumePdfBase64,
    coverLetterPdfBase64,
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
