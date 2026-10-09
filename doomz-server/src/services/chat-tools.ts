import { z } from "zod";
import type { Queryable } from "../db/client";
import type { LLMTool } from "../lib/llm";
import { isUuid } from "../lib/validate";
import { listContainers, listInventory } from "./inventory";
import { getPlan, listPlans, type Plan } from "./plans";

export const TOOLS_PROMPT =
  "You can call tools to read the user's own inventory, storage containers and plans. Use them whenever the answer depends on what the user has or is working on, and never invent quantities, items or plans. The tools are read-only.";

const MAX_ITEMS = 100;

/** Small models often send null or "" for optional arguments; treat those as omitted. */
function dropEmpty(args: unknown) {
  if (!args || typeof args !== "object") return {};
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null && v !== ""));
}

function defineTool<S extends z.ZodObject>(
  name: string,
  description: string,
  schema: S,
  run: (args: z.infer<S>) => Promise<unknown>,
): LLMTool {
  const parameters: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete parameters.$schema;
  return {
    name,
    description,
    parameters,
    async run(args) {
      const parsed = schema.safeParse(dropEmpty(args));
      if (!parsed.success) return { error: "Invalid arguments", details: z.treeifyError(parsed.error) };
      return run(parsed.data);
    },
  };
}

const planSummary = (p: Plan) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  status: p.status,
  priority: p.priority,
  progress: `${p.progress.completed}/${p.progress.total} steps done`,
});

export function createChatTools(db: Queryable): LLMTool[] {
  return [
    defineTool(
      "search_inventory",
      "List the user's inventory items with quantities, units and storage container. Call with no arguments to get everything.",
      z.object({
        query: z.string().describe("Text to match against item name, id or category").optional(),
        category: z.string().describe("Exact category, e.g. Water, Food, Medical").optional(),
        container: z.string().describe('Container id, or "unassigned"').optional(),
      }),
      async ({ query, category, container }) => {
        const [items, containers] = await Promise.all([listInventory(db, { category, container }), listContainers(db)]);
        const containerNames = new Map(containers.map((c) => [c.id, c.name]));
        const needle = query?.toLowerCase();
        let matches = needle
          ? items.filter((i) => [i.name, i.id, i.category].some((f) => f.toLowerCase().includes(needle)))
          : items;
        // Small models guess filters like category "all"; give them everything rather than a misleading empty list.
        const fellBack = matches.length === 0 && Boolean(query || category || container);
        if (fellBack) matches = await listInventory(db);
        return {
          ...(fellBack && { note: "Nothing matched those filters, so this is the full inventory." }),
          total: matches.length,
          items: matches.slice(0, MAX_ITEMS).map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            capacity: i.capacity,
            container: i.containerId ? (containerNames.get(i.containerId) ?? i.containerId) : "unassigned",
          })),
        };
      },
    ),
    defineTool(
      "list_containers",
      "List the user's storage containers (bins, shelves, caches) with location and item count.",
      z.object({}),
      async () => (await listContainers(db)).map(({ id, name, description, location, itemCount }) => ({ id, name, description, location, itemCount })),
    ),
    defineTool(
      "list_plans",
      "List all of the user's plans with status, priority, progress and each step's title and status.",
      z.object({}),
      async () =>
        (await listPlans(db)).map((p) => ({
          ...planSummary(p),
          steps: p.steps.map((st) => ({ title: st.title, status: st.status })),
        })),
    ),
    defineTool(
      "get_plan",
      "Get one plan with all its steps, step status and the inventory each step needs compared to what the user has.",
      z.object({ plan: z.string().describe("Plan id or title") }),
      async ({ plan: ref }) => {
        let plan = isUuid(ref) ? await getPlan(db, ref) : null;
        if (!plan) {
          const needle = ref.toLowerCase();
          const plans = await listPlans(db);
          plan = plans.find((p) => p.title.toLowerCase().includes(needle)) ?? null;
          if (!plan) return { error: `No plan matches "${ref}"`, availablePlans: plans.map((p) => p.title) };
        }

        const onHand = new Map((await listInventory(db)).map((i) => [i.id, i]));
        return {
          ...planSummary(plan),
          description: plan.description,
          steps: plan.steps.map((s) => ({
            title: s.title,
            description: s.description,
            status: s.status,
            requiredItems: s.requiredItems.map((r) => {
              const item = onHand.get(r.itemId);
              return { item: item?.name ?? r.itemId, needed: r.quantity, onHand: item?.quantity ?? 0, unit: item?.unit };
            }),
          })),
        };
      },
    ),
  ];
}
