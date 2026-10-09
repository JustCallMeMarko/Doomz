import type { Queryable } from "../db/client";
import { AppError, notFound } from "../lib/errors";

export type Element = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  properties: Record<string, unknown>;
  isBase: boolean;
  discovered: boolean;
  discoveredAt: Date | null;
};

type Row = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  properties: Record<string, unknown>;
  is_base: boolean;
  discovered: boolean;
  discovered_at: Date | null;
};

const toElement = (r: Row): Element => ({
  id: r.id,
  name: r.name,
  symbol: r.symbol,
  category: r.category,
  description: r.description,
  properties: r.properties,
  isBase: r.is_base,
  discovered: r.discovered,
  discoveredAt: r.discovered_at,
});

export async function listElements(q: Queryable, filters: { discovered?: boolean; category?: string } = {}) {
  const { rows } = await q.query<Row>(
    `SELECT * FROM elements
     WHERE ($1::boolean IS NULL OR discovered = $1)
       AND ($2::text IS NULL OR lower(category) = lower($2))
     ORDER BY is_base DESC, name`,
    [filters.discovered ?? null, filters.category ?? null],
  );
  return rows.map(toElement);
}

export async function getElement(q: Queryable, id: string) {
  const { rows } = await q.query<Row>(`SELECT * FROM elements WHERE id = $1`, [id]);
  return rows[0] ? toElement(rows[0]) : null;
}

/** Element details plus the recipes that produce it and the recipes it is an ingredient in. */
export async function getElementWithRecipes(q: Queryable, id: string) {
  const element = await getElement(q, id);
  if (!element) return null;

  const { rows: createdFrom } = await q.query<{ ingredient_a: string; ingredient_b: string }>(
    `SELECT ingredient_a, ingredient_b FROM element_recipes WHERE result_id = $1 ORDER BY ingredient_a, ingredient_b`,
    [id],
  );
  const { rows: usedIn } = await q.query<{ ingredient_a: string; ingredient_b: string; result_id: string; discovered: boolean }>(
    `SELECT r.ingredient_a, r.ingredient_b, r.result_id, e.discovered
     FROM element_recipes r JOIN elements e ON e.id = r.result_id
     WHERE r.ingredient_a = $1 OR r.ingredient_b = $1
     ORDER BY r.result_id`,
    [id],
  );

  return {
    ...element,
    recipes: createdFrom.map((r) => ({ ingredients: [r.ingredient_a, r.ingredient_b] })),
    usedIn: usedIn.map((r) => ({
      with: r.ingredient_a === id ? r.ingredient_b : r.ingredient_a,
      // Undiscovered results stay hidden so combining is still a discovery.
      result: r.discovered ? r.result_id : null,
    })),
  };
}

async function markDiscovered(q: Queryable, id: string) {
  const { rows } = await q.query<Row>(
    `UPDATE elements SET discovered = true, discovered_at = now()
     WHERE id = $1 AND NOT discovered RETURNING *`,
    [id],
  );
  return rows[0] ? toElement(rows[0]) : null;
}

export async function unlockElement(q: Queryable, id: string) {
  const unlocked = await markDiscovered(q, id);
  if (unlocked) return { element: unlocked, isNew: true };
  const element = await getElement(q, id);
  if (!element) throw notFound("Element");
  return { element, isNew: false };
}

export async function combineElements(q: Queryable, first: string, second: string) {
  const [a, b] = [first, second].sort() as [string, string];
  const { rows: ingredients } = await q.query<Row>(`SELECT * FROM elements WHERE id = ANY($1::text[])`, [[a, b]]);
  const byId = new Map(ingredients.map((r) => [r.id, r]));

  const missing = [a, b].filter((id) => !byId.has(id));
  if (missing.length > 0) throw new AppError(404, "Element not found", { missing });

  const locked = [...new Set([a, b])].filter((id) => !byId.get(id)!.discovered);
  if (locked.length > 0) throw new AppError(409, "Ingredients must be discovered before combining", { locked });

  const { rows } = await q.query<{ result_id: string }>(
    `SELECT result_id FROM element_recipes WHERE ingredient_a = $1 AND ingredient_b = $2`,
    [a, b],
  );
  const resultId = rows[0]?.result_id;
  if (!resultId) return { success: false as const, result: null, isNew: false };

  const { element, isNew } = await unlockElement(q, resultId);
  return { success: true as const, result: element, isNew };
}
