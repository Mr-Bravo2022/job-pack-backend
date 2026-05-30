import { LlmBackend } from './LlmBackend';

export class OllamaBackend implements LlmBackend {
  constructor(
    private baseUrl: string,
    private apiKey: string | null,
    private model: string
  ) {}

  async generate(prompt: string): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: this.model, prompt, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as { response: string };
    return data.response;
  }
}
