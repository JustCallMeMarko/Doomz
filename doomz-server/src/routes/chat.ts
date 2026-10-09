import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { z } from "zod";
import type { AppDeps } from "../app";
import { AppError, notFound } from "../lib/errors";
import type { LLMMessage } from "../lib/llm";
import { isUuid, validate } from "../lib/validate";
import {
  addMessage,
  createThread,
  deleteThread,
  getThread,
  listMessages,
  listThreads,
  PERSONA_PROMPTS,
  PERSONAS,
  touchThread,
  type ChatThread,
} from "../services/chat";
import { createChatTools, TOOLS_PROMPT } from "../services/chat-tools";
import { listInventory } from "../services/inventory";
import { createPlan, PLAN_PRIORITIES, type PlanInput } from "../services/plans";

const HISTORY_LIMIT = 20;

const streamSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  threadId: z.string().optional(),
  persona: z.enum(PERSONAS).optional(),
});

const generatePlanSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  category: z.string().trim().min(1).max(100).optional(),
  persona: z.enum(PERSONAS).optional(),
  save: z.boolean().default(true),
});

/** Lenient schema for model output: small models often omit or mangle optional fields. */
const generatedPlanSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).catch(""),
  category: z.string().trim().min(1).max(100).optional().catch(undefined),
  priority: z.enum(PLAN_PRIORITIES).catch("medium"),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().max(2000).catch(""),
        requiredItems: z
          .array(z.object({ itemId: z.string(), quantity: z.coerce.number().int().positive() }))
          .catch([]),
      }),
    )
    .min(1)
    .max(100),
});

function parseModelJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const threadTitle = (message: string) => (message.length > 60 ? `${message.slice(0, 57).trimEnd()}...` : message);

export function chatRoutes({ db, llm }: AppDeps) {
  const requireThread = async (id: string) => {
    const thread = isUuid(id) ? await getThread(db, id) : null;
    if (!thread) throw notFound("Thread");
    return thread;
  };
  const tools = createChatTools(db);

  return new Hono()
    .post("/stream", validate("json", streamSchema), async (c) => {
      const { message, threadId, persona } = c.req.valid("json");
      const existing = threadId ? await requireThread(threadId) : null;
      const activePersona = persona ?? existing?.persona ?? "general";
      const history = existing ? await listMessages(db, existing.id, HISTORY_LIMIT - 1) : [];

      const messages: LLMMessage[] = [
        { role: "system", content: `${PERSONA_PROMPTS[activePersona]}\n\n${TOOLS_PROMPT}` },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ];

      // Pull the first chunk before committing to a 200 so an unreachable model returns a proper error.
      const iterator = llm.streamChat(messages, { signal: c.req.raw.signal, tools })[Symbol.asyncIterator]();
      let first: IteratorResult<string>;
      try {
        first = await iterator.next();
      } catch (err) {
        throw new AppError(502, "Language model unavailable", { message: err instanceof Error ? err.message : String(err) });
      }

      const thread: ChatThread = existing ?? (await createThread(db, threadTitle(message), activePersona));
      await addMessage(db, thread.id, "user", message);
      await touchThread(db, thread.id, persona);

      c.header("X-Thread-Id", thread.id);
      return streamText(
        c,
        async (stream) => {
          let reply = "";
          try {
            for (let chunk = first; !chunk.done; chunk = await iterator.next()) {
              reply += chunk.value;
              await stream.write(chunk.value);
            }
          } finally {
            if (reply) {
              await addMessage(db, thread.id, "assistant", reply);
              await touchThread(db, thread.id);
            }
          }
        },
        async (err, stream) => {
          console.error("chat stream failed", err);
          await stream.write("\n\n[Doomz: response interrupted]");
        },
      );
    })
    .post("/generate-plan", validate("json", generatePlanSchema), async (c) => {
      const { prompt, category, persona, save } = c.req.valid("json");
      const inventory = await listInventory(db);
      const knownItems = new Set(inventory.map((i) => i.id));

      const system = [
        PERSONA_PROMPTS[persona ?? "general"],
        "Create an actionable strategy plan for the user's goal. Respond with ONLY a JSON object of this shape:",
        `{"title": string, "description": string, "category": string, "priority": "low" | "medium" | "high", "steps": [{"title": string, "description": string, "requiredItems": [{"itemId": string, "quantity": number}]}]}`,
        "Use 3-8 concrete steps. Only reference these inventory item ids in requiredItems (leave it empty if none apply):",
        inventory.map((i) => `- ${i.id} (${i.name}, ${i.quantity} ${i.unit} available)`).join("\n"),
        category ? `The plan category must be "${category}".` : "",
      ]
        .filter(Boolean)
        .join("\n");

      let raw: string;
      try {
        raw = await llm.completeJSON(
          [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          c.req.raw.signal,
        );
      } catch (err) {
        throw new AppError(502, "Language model unavailable", { message: err instanceof Error ? err.message : String(err) });
      }

      const parsed = generatedPlanSchema.safeParse(parseModelJson(raw));
      if (!parsed.success) {
        throw new AppError(502, "Language model returned an invalid plan", z.treeifyError(parsed.error));
      }

      const draft: PlanInput = {
        title: parsed.data.title,
        description: parsed.data.description,
        category: category ?? parsed.data.category ?? "General",
        priority: parsed.data.priority,
        steps: parsed.data.steps.map((s) => ({
          title: s.title,
          description: s.description,
          requiredItems: s.requiredItems.filter((r) => knownItems.has(r.itemId)),
        })),
      };

      if (!save) return c.json({ saved: false as const, plan: draft });
      return c.json({ saved: true as const, plan: await createPlan(db, draft) }, 201);
    })
    .get("/history", async (c) => {
      return c.json(await listThreads(db));
    })
    .get("/history/:threadId", async (c) => {
      const thread = await requireThread(c.req.param("threadId"));
      return c.json({ ...thread, messages: await listMessages(db, thread.id) });
    })
    .delete("/history/:threadId", async (c) => {
      const id = c.req.param("threadId");
      if (!isUuid(id) || !(await deleteThread(db, id))) throw notFound("Thread");
      return c.body(null, 204);
    });
}
