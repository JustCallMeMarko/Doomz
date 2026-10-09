import OpenAI from "openai";

export type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

/** A function the model may call while answering. `parameters` is a JSON Schema object. */
export type LLMTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(args: unknown): Promise<unknown>;
};

export type StreamChatOptions = { signal?: AbortSignal; tools?: LLMTool[] };

export interface LLM {
  /** Yields text deltas as they are generated, running any tool calls the model makes in between. */
  streamChat(messages: LLMMessage[], options?: StreamChatOptions): AsyncIterable<string>;
  /** Returns a single completion constrained to a JSON object. */
  completeJSON(messages: LLMMessage[], signal?: AbortSignal): Promise<string>;
}

export type OllamaConfig = { baseURL: string; model: string; apiKey?: string };

/** Tool rounds per reply before the model is forced to answer in text. */
const MAX_TOOL_ROUNDS = 4;

/** Runs a model-requested tool call, turning bad arguments and failures into an `{ error }` result for the model. */
export async function runTool(tool: LLMTool | undefined, rawArgs: string): Promise<unknown> {
  if (!tool) return { error: "Unknown tool" };
  let args: unknown;
  try {
    args = rawArgs.trim() ? JSON.parse(rawArgs) : {};
  } catch {
    return { error: "Tool arguments must be valid JSON" };
  }
  try {
    return await tool.run(args);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** LLM backed by a local Ollama server through its OpenAI-compatible API. */
export function createOllamaLLM(config: OllamaConfig): LLM {
  const client = new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey ?? "ollama" });

  return {
    async *streamChat(messages, { signal, tools = [] } = {}) {
      const convo: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages];
      const toolsByName = new Map(tools.map((t) => [t.name, t]));
      const toolSpecs: OpenAI.Chat.ChatCompletionTool[] = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));

      for (let round = 0; ; round++) {
        const offerTools = toolSpecs.length > 0 && round < MAX_TOOL_ROUNDS;
        const stream = await client.chat.completions.create(
          { model: config.model, messages: convo, stream: true, ...(offerTools && { tools: toolSpecs }) },
          { signal },
        );

        let content = "";
        const calls: { id: string; name: string; arguments: string }[] = [];
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            content += delta.content;
            yield delta.content;
          }
          for (const tc of delta?.tool_calls ?? []) {
            const call = (calls[tc.index] ??= { id: "", name: "", arguments: "" });
            if (tc.id) call.id = tc.id;
            if (tc.function?.name) call.name += tc.function.name;
            if (tc.function?.arguments) call.arguments += tc.function.arguments;
          }
        }

        const requested = calls.filter(Boolean).map((c, i) => ({ ...c, id: c.id || `call_${round}_${i}` }));
        if (requested.length === 0) return;

        convo.push({
          role: "assistant",
          content: content || null,
          tool_calls: requested.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.arguments } })),
        });
        for (const call of requested) {
          const result = await runTool(toolsByName.get(call.name), call.arguments);
          convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        }
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
