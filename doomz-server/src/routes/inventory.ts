import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps } from "../app";
import { notFound } from "../lib/errors";
import { validate } from "../lib/validate";
import {
  consumeItems,
  createContainer,
  CONTAINER_COLORS,
  createItem,
  deleteContainer,
  deleteInventoryItem,
  getContainer,
  listContainers,
  listInventory,
  updateInventoryItem,
} from "../services/inventory";
import { requiredItemSchema } from "./plans";

const listQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  container: z.string().trim().min(1).optional(),
});

const patchSchema = z
  .object({
    delta: z.number().int().optional(),
    quantity: z.number().int().nonnegative().optional(),
    capacity: z.number().int().positive().optional(),
    level: z.number().int().min(1).optional(),
    containerId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: "At least one field is required" })
  .refine((b) => b.delta === undefined || b.quantity === undefined, {
    message: "Provide either `delta` or `quantity`, not both",
  });

const consumeSchema = z.object({ items: z.array(requiredItemSchema).min(1).max(100) });

const createItemSchema = z.object({
  id: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(30).optional(),
  quantity: z.number().int().nonnegative().optional(),
  capacity: z.number().int().positive(),
  level: z.number().int().min(1).optional(),
  containerId: z.string().trim().min(1).nullable().optional(),
});

const createContainerSchema = z.object({
  id: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  color: z.enum(CONTAINER_COLORS).optional(),
});

export function inventoryRoutes({ db }: AppDeps) {
  return new Hono()
    .get("/", validate("query", listQuerySchema), async (c) => {
      return c.json(await listInventory(db, c.req.valid("query")));
    })
    .post("/items", validate("json", createItemSchema), async (c) => {
      return c.json(await createItem(db, c.req.valid("json")), 201);
    })
    .patch("/items/:id", validate("json", patchSchema), async (c) => {
      return c.json(await updateInventoryItem(db, c.req.param("id"), c.req.valid("json")));
    })
    .delete("/items/:id", async (c) => {
      const id = c.req.param("id");
      if (!(await db.transaction((tx) => deleteInventoryItem(tx, id)))) throw notFound("Inventory item");
      return c.body(null, 204);
    })
    .get("/containers", async (c) => {
      return c.json(await listContainers(db));
    })
    .post("/containers", validate("json", createContainerSchema), async (c) => {
      return c.json(await createContainer(db, c.req.valid("json")), 201);
    })
    .get("/containers/:id", async (c) => {
      const id = c.req.param("id");
      const container = await getContainer(db, id);
      if (!container) throw notFound("Container");
      return c.json({ ...container, items: await listInventory(db, { container: id }) });
    })
    .delete("/containers/:id", async (c) => {
      if (!(await deleteContainer(db, c.req.param("id")))) throw notFound("Container");
      return c.body(null, 204);
    })
    .post("/consume", validate("json", consumeSchema), async (c) => {
      const { items } = c.req.valid("json");
      const updated = await db.transaction((tx) => consumeItems(tx, items));
      return c.json({ items: updated });
    });
}
