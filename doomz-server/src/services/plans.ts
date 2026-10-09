import type { DB, Queryable } from "../db/client";
import { AppError, notFound } from "../lib/errors";
import { consumeItems, type InventoryItem, type ItemAmount } from "./inventory";

export const PLAN_STATUSES = ["todo", "in_progress", "done"] as const;
export const PLAN_PRIORITIES = ["low", "medium", "high"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanPriority = (typeof PLAN_PRIORITIES)[number];

export type PlanStep = {
  id: string;
  title: string;
  description: string;
  position: number;
  status: PlanStatus;
  completed: boolean;
  completedAt: Date | null;
  requiredItems: ItemAmount[];
};

export type Plan = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: PlanStatus;
  priority: PlanPriority;
  steps: PlanStep[];
  progress: { completed: number; total: number };
  createdAt: Date;
  updatedAt: Date;
};

export type StepInput = {
  title: string;
  description?: string;
  status?: PlanStatus;
  completed?: boolean;
  requiredItems?: ItemAmount[];
};

export type PlanInput = {
  title: string;
  description?: string;
  category?: string;
  priority?: PlanPriority;
  status?: PlanStatus;
  steps?: StepInput[];
};

export type PlanPatch = Partial<PlanInput>;

type PlanRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: PlanStatus;
  priority: PlanPriority;
  created_at: Date;
  updated_at: Date;
};

type StepRow = {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  position: number;
  status: PlanStatus;
  completed: boolean;
  completed_at: Date | null;
  required_items: ItemAmount[];
};

const toStep = (r: StepRow): PlanStep => ({
  id: r.id,
  title: r.title,
  description: r.description,
  position: r.position,
  status: r.status,
  completed: r.completed,
  completedAt: r.completed_at,
  requiredItems: r.required_items,
});

const stepStatus = (s: { status?: PlanStatus; completed?: boolean }): PlanStatus =>
  s.status ?? (s.completed ? "done" : "todo");

/** A plan's status follows its steps: all todo → todo, all done → done, otherwise in_progress. */
export function deriveStatus(steps: { status?: PlanStatus; completed?: boolean }[]): PlanStatus {
  const statuses = steps.map(stepStatus);
  if (statuses.length === 0 || statuses.every((s) => s === "todo")) return "todo";
  return statuses.every((s) => s === "done") ? "done" : "in_progress";
}

async function hydrate(q: Queryable, rows: PlanRow[]): Promise<Plan[]> {
  if (rows.length === 0) return [];
  const { rows: stepRows } = await q.query<StepRow>(
    `SELECT * FROM plan_steps WHERE plan_id = ANY($1::uuid[]) ORDER BY position`,
    [rows.map((r) => r.id)],
  );
  const stepsByPlan = new Map<string, PlanStep[]>();
  for (const s of stepRows) {
    const list = stepsByPlan.get(s.plan_id) ?? [];
    list.push(toStep(s));
    stepsByPlan.set(s.plan_id, list);
  }
  return rows.map((r) => {
    const steps = stepsByPlan.get(r.id) ?? [];
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      priority: r.priority,
      steps,
      progress: { completed: steps.filter((s) => s.completed).length, total: steps.length },
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

export async function listPlans(q: Queryable, filters: { status?: PlanStatus; category?: string } = {}) {
  const { rows } = await q.query<PlanRow>(
    `SELECT * FROM plans
     WHERE ($1::text IS NULL OR status = $1)
       AND ($2::text IS NULL OR lower(category) = lower($2))
     ORDER BY created_at DESC`,
    [filters.status ?? null, filters.category ?? null],
  );
  return hydrate(q, rows);
}

export async function getPlan(q: Queryable, id: string): Promise<Plan | null> {
  const { rows } = await q.query<PlanRow>(`SELECT * FROM plans WHERE id = $1`, [id]);
  const [plan] = await hydrate(q, rows);
  return plan ?? null;
}

async function assertKnownItems(q: Queryable, steps: StepInput[]) {
  const ids = [...new Set(steps.flatMap((s) => s.requiredItems ?? []).map((r) => r.itemId))];
  if (ids.length === 0) return;
  const { rows } = await q.query<{ id: string }>(`SELECT id FROM inventory_items WHERE id = ANY($1::text[])`, [ids]);
  const known = new Set(rows.map((r) => r.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length > 0) throw new AppError(400, "Unknown inventory items in requiredItems", { unknown });
}

async function insertSteps(q: Queryable, planId: string, steps: StepInput[]) {
  await assertKnownItems(q, steps);
  for (const [position, step] of steps.entries()) {
    const status = stepStatus(step);
    await q.query(
      `INSERT INTO plan_steps (plan_id, title, description, position, status, completed, completed_at, required_items)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN now() END, $7)`,
      [planId, step.title, step.description ?? "", position, status, status === "done", JSON.stringify(step.requiredItems ?? [])],
    );
  }
}

export async function createPlan(db: DB, input: PlanInput): Promise<Plan> {
  return db.transaction(async (tx) => {
    const steps = input.steps ?? [];
    const status = input.status ?? deriveStatus(steps);
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO plans (title, description, category, priority, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [input.title, input.description ?? "", input.category ?? "General", input.priority ?? "medium", status],
    );
    const id = rows[0]!.id;
    await insertSteps(tx, id, steps);
    return (await getPlan(tx, id))!;
  });
}

export async function updatePlan(db: DB, id: string, patch: PlanPatch): Promise<Plan> {
  return db.transaction(async (tx) => {
    const existing = await getPlan(tx, id);
    if (!existing) throw notFound("Plan");

    let status = patch.status ?? existing.status;
    if (patch.steps) {
      await tx.query(`DELETE FROM plan_steps WHERE plan_id = $1`, [id]);
      await insertSteps(tx, id, patch.steps);
      if (!patch.status) status = deriveStatus(patch.steps);
    }

    await tx.query(
      `UPDATE plans SET title = $2, description = $3, category = $4, priority = $5, status = $6, updated_at = now()
       WHERE id = $1`,
      [
        id,
        patch.title ?? existing.title,
        patch.description ?? existing.description,
        patch.category ?? existing.category,
        patch.priority ?? existing.priority,
        status,
      ],
    );
    return (await getPlan(tx, id))!;
  });
}

export async function deletePlan(q: Queryable, id: string) {
  const { affectedRows } = await q.query(`DELETE FROM plans WHERE id = $1`, [id]);
  return (affectedRows ?? 0) > 0;
}

export type StepToggleOptions = { status?: PlanStatus; completed?: boolean; consumeItems?: boolean };

/**
 * Sets a step's `status` (or completion; toggles if both are omitted) and recomputes the plan status.
 * With `consumeItems`, completing a step deducts its `requiredItems` from inventory atomically.
 */
export async function setStepCompletion(
  db: DB,
  planId: string,
  stepId: string,
  opts: StepToggleOptions = {},
): Promise<{ plan: Plan; consumed: InventoryItem[] }> {
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<StepRow>(`SELECT * FROM plan_steps WHERE id = $1 AND plan_id = $2`, [stepId, planId]);
    const step = rows[0];
    if (!step) {
      const plan = await tx.query(`SELECT 1 FROM plans WHERE id = $1`, [planId]);
      throw notFound(plan.rows.length ? "Step" : "Plan");
    }

    const status: PlanStatus = opts.status ?? ((opts.completed ?? !step.completed) ? "done" : "todo");
    const completed = status === "done";
    let consumed: InventoryItem[] = [];
    if (completed && !step.completed && opts.consumeItems) {
      consumed = await consumeItems(tx, step.required_items);
    }

    await tx.query(
      `UPDATE plan_steps SET status = $3, completed = $2,
         completed_at = CASE WHEN $2 THEN COALESCE(completed_at, now()) END
       WHERE id = $1`,
      [stepId, completed, status],
    );

    const { rows: all } = await tx.query<{ status: PlanStatus }>(`SELECT status FROM plan_steps WHERE plan_id = $1`, [planId]);
    await tx.query(`UPDATE plans SET status = $2, updated_at = now() WHERE id = $1`, [planId, deriveStatus(all)]);

    const plan = await getPlan(tx, planId);
    if (!plan) throw new AppError(500, "Plan disappeared during update");
    return { plan, consumed };
  });
}
