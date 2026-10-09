import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps } from "../app";
import { notFound } from "../lib/errors";
import { validate } from "../lib/validate";
import { combineElements, getElementWithRecipes, listElements, unlockElement } from "../services/elements";

const elementId = z.string().trim().min(1).toLowerCase();

const listQuerySchema = z.object({
  discovered: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  category: z.string().trim().min(1).optional(),
});

const combineSchema = z.object({ elementA: elementId, elementB: elementId });
const unlockSchema = z.object({ elementId });

export function elementRoutes({ db }: AppDeps) {
  return new Hono()
    .get("/", validate("query", listQuerySchema), async (c) => {
      return c.json(await listElements(db, c.req.valid("query")));
    })
    .post("/combine", validate("json", combineSchema), async (c) => {
      const { elementA, elementB } = c.req.valid("json");
      return c.json(await db.transaction((tx) => combineElements(tx, elementA, elementB)));
    })
    .post("/unlock", validate("json", unlockSchema), async (c) => {
      return c.json(await unlockElement(db, c.req.valid("json").elementId));
    })
    .get("/:id", async (c) => {
      const element = await getElementWithRecipes(db, c.req.param("id").toLowerCase());
      if (!element) throw notFound("Element");
      return c.json(element);
    });
}
