import Router from '@koa/router';
import multer from '@koa/multer';
// Import the library file directly to bypass pdf-parse's self-test which crashes at runtime
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;
import mammoth from 'mammoth';
import { createLlmBackend } from '../llm/factory';

const router = new Router();
const backend = createLlmBackend();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// Uses the LLM to clean up raw extracted text from any resume layout:
// merges duplicate sections, removes repeated headers, normalizes structure.
async function normalizeResumeText(raw: string): Promise<string> {
  const prompt = `You are given raw text extracted from a resume PDF. PDF extraction often produces duplicated sections, repeated headers, garbled column text, and out-of-order content depending on the resume layout.

Your job is to clean this up into a single, well-structured plain-text resume. Follow these rules:
- Merge duplicate sections into one (e.g. if SKILLS appears twice, combine all skills into one list).
- Remove repeated name/title headers that appear at the top of each page.
- Preserve all unique information — do not summarize, shorten, or invent anything.
- Output clean sections in this order (skip any that are not present): Summary, Experience, Skills, Education, Certifications, Projects, Other.
- Use plain text only. No markdown, no HTML, no bullet symbols beyond a simple dash (-).
- Return ONLY the cleaned resume text. No preamble, no explanation.

Raw extracted text:
${raw}`;

  try {
    return await backend.generate(prompt);
  } catch {
    // If LLM cleanup fails, fall back to raw text so the user isn't left with nothing
    return raw;
  }
}

router.post('/api/parse-resume', upload.single('file'), async (ctx) => {
  const file = ctx.file;

  if (!file) {
    ctx.status = 400;
    ctx.body = { error: 'No file uploaded' };
    return;
  }

  const mime = file.mimetype;
  const originalName = file.originalname.toLowerCase();
  let rawText = '';

  try {
    if (mime === 'application/pdf' || originalName.endsWith('.pdf')) {
      const parsed = await pdfParse(file.buffer);
      rawText = parsed.text;
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = result.value;
    } else if (mime === 'text/plain' || originalName.endsWith('.txt')) {
      rawText = file.buffer.toString('utf-8');
    } else {
      ctx.status = 415;
      ctx.body = { error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.' };
      return;
    }

    if (!rawText.trim()) {
      ctx.status = 422;
      ctx.body = { error: 'Could not extract text from the file. Try copying and pasting your resume instead.' };
      return;
    }

    // Run LLM cleanup to merge duplicate sections and normalize layout
    const cleanedText = await normalizeResumeText(rawText.trim());

    ctx.body = { text: cleanedText };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to parse the file. Try copying and pasting your resume instead.' };
  }
});

export default router;
