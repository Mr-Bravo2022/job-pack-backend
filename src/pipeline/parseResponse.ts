import { RawLlmOutput } from './callLlm';

export interface InfographicData {
  companyName: string;
  roleName: string;
  pros: string[];
  cons: string[];
  fitScore: number;
  keySkillsRequired: string[];
  recommendation: 'Yes' | 'No' | 'Maybe';
  summary: string;
}

export interface StructuredContent {
  resumeHtml: string;
  coverLetterHtml: string;
  infographic: InfographicData;
}

export function parseResponse(raw: RawLlmOutput): StructuredContent {
  let infographic: InfographicData;

  try {
    // Strip markdown code fences if the LLM wrapped the JSON
    const cleaned = raw.infographicJson
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    // Normalize fitScore — LLM sometimes returns 65 meaning 6.5
    let score = Number(parsed.fitScore ?? 0);
    if (score > 10) score = score / 10;
    score = Math.min(10, Math.max(0, Math.round(score * 10) / 10));
    infographic = { ...parsed, fitScore: score };
  } catch {
    // Fallback so the pipeline never crashes on a bad parse
    infographic = {
      companyName: 'Unknown',
      roleName: 'Unknown',
      pros: [],
      cons: [],
      fitScore: 0,
      keySkillsRequired: [],
      recommendation: 'Maybe',
      summary: 'Could not analyze fit — please try again.',
    };
  }

  return {
    resumeHtml: raw.resumeHtml,
    coverLetterHtml: raw.coverLetterHtml,
    infographic,
  };
}
