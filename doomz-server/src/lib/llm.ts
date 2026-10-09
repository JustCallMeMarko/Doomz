import OpenAI from "openai";

export type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

export interface LLM {
  /** Yields text deltas as they are generated. */
  streamChat(messages: LLMMessage[], signal?: AbortSignal): AsyncIterable<string>;
  /** Returns a single completion constrained to a JSON object. */
  completeJSON(messages: LLMMessage[], signal?: AbortSignal): Promise<string>;
}

export type OllamaConfig = { baseURL: string; model: string; apiKey?: string };

/** LLM backed by a local Ollama server through its OpenAI-compatible API. */
export function createOllamaLLM(config: OllamaConfig): LLM {
  const client = new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey ?? "ollama" });

  return {
    async *streamChat(messages, signal) {
      const stream = await client.chat.completions.create(
        { model: config.model, messages, stream: true },
        { signal },
      );
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    },
    async completeJSON(messages, signal) {
      const res = await client.chat.completions.create(
        { model: config.model, messages, response_format: { type: "json_object" } },
        { signal },
      );
      return res.choices[0]?.message?.content ?? "";
    },
  };
}
