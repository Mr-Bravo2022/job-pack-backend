import { LlmBackend } from '../llm/LlmBackend';
import { PromptBundle } from './buildPrompt';

export interface RawLlmOutput {
  resumeHtml: string;
  coverLetterHtml: string;
  infographicJson: string;
}

export async function callLlm(
  prompts: PromptBundle,
  backend: LlmBackend
): Promise<RawLlmOutput> {
  const [resumeHtml, coverLetterHtml, infographicJson] = await Promise.all([
    backend.generate(prompts.resumePrompt),
    backend.generate(prompts.coverLetterPrompt),
    backend.generate(prompts.infographicPrompt),
  ]);

  return { resumeHtml, coverLetterHtml, infographicJson };
}
