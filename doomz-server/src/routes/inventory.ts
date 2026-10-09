import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps } from "../app";
import { validate } from "../lib/validate";
import { consumeItems, listInventory, updateInventoryItem } from "../services/inventory";
import { requiredItemSchema } from "./plans";

const listQuerySchema = z.object({ category: z.string().trim().min(1).optional() });

const patchSchema = z
  .object({
    delta: z.number().int().optional(),
    quantity: z.number().int().nonnegative().optional(),
    capacity: z.number().int().positive().optional(),
    level: z.number().int().min(1).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: "At least one field is required" })
  .refine((b) => b.delta === undefined || b.quantity === undefined, {
    message: "Provide either `delta` or `quantity`, not both",
  });

const consumeSchema = z.object({ items: z.array(requiredItemSchema).min(1).max(100) });

export function inventoryRoutes({ db }: AppDeps) {
  return new Hono()
    .get("/", validate("query", listQuerySchema), async (c) => {
      return c.json(await listInventory(db, c.req.valid("query").category));
    })
    .patch("/items/:id", validate("json", patchSchema), async (c) => {
      return c.json(await updateInventoryItem(db, c.req.param("id"), c.req.valid("json")));
    })
    .post("/consume", validate("json", consumeSchema), async (c) => {
      const { items } = c.req.valid("json");
      const updated = await db.transaction((tx) => consumeItems(tx, items));
      return c.json({ items: updated });
    });
}
