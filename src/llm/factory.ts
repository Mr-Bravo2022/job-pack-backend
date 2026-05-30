import { LlmBackend } from './LlmBackend';
import { OllamaBackend } from './OllamaBackend';

export function createLlmBackend(): LlmBackend {
  const which = process.env.LLM_BACKEND;

  if (which === 'class-ollama') {
    return new OllamaBackend(
      process.env.OLLAMA_URL!,
      process.env.OLLAMA_API_KEY!,
      process.env.OLLAMA_MODEL!
    );
  }

  if (which === 'local-ollama') {
    return new OllamaBackend(
      process.env.LOCAL_OLLAMA_URL!,
      null,
      process.env.OLLAMA_MODEL!
    );
  }

  throw new Error(`Unknown LLM_BACKEND: "${which}". Set LLM_BACKEND to "class-ollama" or "local-ollama".`);
}
