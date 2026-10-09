import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps } from "../app";
import { AppError, notFound } from "../lib/errors";
import { isUuid, validate } from "../lib/validate";
import {
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  PLAN_PRIORITIES,
  PLAN_STATUSES,
  setStepCompletion,
  updatePlan,
} from "../services/plans";

export const requiredItemSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

const stepSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  completed: z.boolean().optional(),
  requiredItems: z.array(requiredItemSchema).max(50).optional(),
});

const planSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  priority: z.enum(PLAN_PRIORITIES).optional(),
  status: z.enum(PLAN_STATUSES).optional(),
  steps: z.array(stepSchema).max(100).optional(),
});

const planPatchSchema = planSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field is required" });

const listQuerySchema = z.object({
  status: z.enum(PLAN_STATUSES).optional(),
  category: z.string().trim().min(1).optional(),
});

const stepToggleSchema = z.object({
  completed: z.boolean().optional(),
  consumeItems: z.boolean().optional(),
});

export function planRoutes({ db }: AppDeps) {
  const requirePlanId = (id: string) => {
    if (!isUuid(id)) throw notFound("Plan");
    return id;
  };

  return new Hono()
    .get("/", validate("query", listQuerySchema), async (c) => {
      return c.json(await listPlans(db, c.req.valid("query")));
    })
    .post("/", validate("json", planSchema), async (c) => {
      return c.json(await createPlan(db, c.req.valid("json")), 201);
    })
    .get("/:id", async (c) => {
      const plan = await getPlan(db, requirePlanId(c.req.param("id")));
      if (!plan) throw notFound("Plan");
      return c.json(plan);
    })
    .patch("/:id", validate("json", planPatchSchema), async (c) => {
      return c.json(await updatePlan(db, requirePlanId(c.req.param("id")), c.req.valid("json")));
    })
    .patch("/:id/steps/:stepId", async (c) => {
      const planId = requirePlanId(c.req.param("id"));
      const stepId = c.req.param("stepId");
      if (!isUuid(stepId)) throw notFound("Step");

      // Body is optional: an empty request simply toggles the step.
      const raw = await c.req.json().catch(() => ({}));
      const body = stepToggleSchema.safeParse(raw ?? {});
      if (!body.success) throw new AppError(400, "Invalid request", z.treeifyError(body.error));

      return c.json(await setStepCompletion(db, planId, stepId, body.data));
    })
    .delete("/:id", async (c) => {
      if (!(await deletePlan(db, requirePlanId(c.req.param("id"))))) throw notFound("Plan");
      return c.body(null, 204);
    });
}
