import { afterAll, expect, test } from "bun:test";
import { createOllamaLLM, type LLMTool } from "../src/lib/llm";

type Body = { messages: { role: string; content?: string | null; tool_call_id?: string }[]; tools?: unknown[] };
const requests: Body[] = [];

const sse = (deltas: object[], finish: string) =>
  [...deltas.map((delta) => ({ delta, finish_reason: null })), { delta: {}, finish_reason: finish }]
    .map((choice) => `data: ${JSON.stringify({ id: "x", object: "chat.completion.chunk", created: 0, model: "m", choices: [{ index: 0, ...choice }] })}\n\n`)
    .join("") + "data: [DONE]\n\n";

// Minimal OpenAI-compatible server: asks for a tool on the first turn, then answers using the tool result.
const server = Bun.serve({
  port: 0,
  async fetch(req) {
    const body = (await req.json()) as Body;
    requests.push(body);
    const last = body.messages.at(-1)!;
    const text =
      last.role === "tool"
        ? sse([{ content: "You have " }, { content: last.content }], "stop")
        : sse(
            [
              { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "lookup", arguments: '{"q":' } }] },
              { tool_calls: [{ index: 0, function: { arguments: '"water"}' } }] },
            ],
            "tool_calls",
          );
    return new Response(text, { headers: { "Content-Type": "text/event-stream" } });
  },
});
afterAll(() => server.stop());

test("streamChat runs tool calls and feeds results back to the model", async () => {
  const calls: unknown[] = [];
  const lookup: LLMTool = {
    name: "lookup",
    description: "Look up an item",
    parameters: { type: "object", properties: { q: { type: "string" } } },
    run: async (args) => {
      calls.push(args);
      return { quantity: 60 };
    },
  };
  const llm = createOllamaLLM({ baseURL: `${server.url}v1`, model: "m" });

  let reply = "";
  for await (const delta of llm.streamChat([{ role: "user", content: "water?" }], { tools: [lookup] })) reply += delta;

  expect(calls).toEqual([{ q: "water" }]);
  expect(reply).toBe('You have {"quantity":60}');
  expect(requests).toHaveLength(2);
  expect(requests[0]!.tools).toHaveLength(1);
  expect(requests[1]!.messages.map((m) => m.role)).toEqual(["user", "assistant", "tool"]);
  expect(requests[1]!.messages[2]!.tool_call_id).toBe("call_1");
});
