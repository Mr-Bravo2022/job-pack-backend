export interface LlmBackend {
  generate(prompt: string): Promise<string>;
}
