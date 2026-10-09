import type { Queryable } from "../db/client";
import { AppError, notFound } from "../lib/errors";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  capacity: number;
  level: number;
  updatedAt: Date;
};

export type ItemAmount = { itemId: string; quantity: number };

type Row = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  capacity: number;
  level: number;
  updated_at: Date;
};

const toItem = (r: Row): InventoryItem => ({
  id: r.id,
  name: r.name,
  category: r.category,
  unit: r.unit,
  quantity: r.quantity,
  capacity: r.capacity,
  level: r.level,
  updatedAt: r.updated_at,
});

export async function listInventory(q: Queryable, category?: string) {
  const { rows } = await q.query<Row>(
    `SELECT * FROM inventory_items
     WHERE ($1::text IS NULL OR lower(category) = lower($1))
     ORDER BY category, name`,
    [category ?? null],
  );
  return rows.map(toItem);
}

export async function getInventoryItem(q: Queryable, id: string) {
  const { rows } = await q.query<Row>(`SELECT * FROM inventory_items WHERE id = $1`, [id]);
  return rows[0] ? toItem(rows[0]) : null;
}

export type InventoryPatch = { delta?: number; quantity?: number; capacity?: number; level?: number };

export async function updateInventoryItem(q: Queryable, id: string, patch: InventoryPatch) {
  const item = await getInventoryItem(q, id);
  if (!item) throw notFound("Inventory item");

  const capacity = patch.capacity ?? item.capacity;
  const quantity = patch.quantity ?? item.quantity + (patch.delta ?? 0);
  const level = patch.level ?? item.level;

  if (quantity < 0) {
    throw new AppError(409, "Insufficient quantity", { itemId: id, available: item.quantity, requested: -(patch.delta ?? 0) });
  }
  if (quantity > capacity) {
    throw new AppError(409, "Quantity exceeds item capacity", { itemId: id, quantity, capacity });
  }

  const { rows } = await q.query<Row>(
    `UPDATE inventory_items SET quantity = $2, capacity = $3, level = $4, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, quantity, capacity, level],
  );
  return toItem(rows[0]!);
}

/**
 * Atomically deducts the requested amounts. Must be called inside a transaction
 * so that a shortage on any item leaves the whole inventory untouched.
 */
export async function consumeItems(q: Queryable, requested: ItemAmount[]) {
  const totals = new Map<string, number>();
  for (const { itemId, quantity } of requested) {
    totals.set(itemId, (totals.get(itemId) ?? 0) + quantity);
  }
  const ids = [...totals.keys()];
  if (ids.length === 0) return [];

  const { rows } = await q.query<Row>(`SELECT * FROM inventory_items WHERE id = ANY($1::text[]) FOR UPDATE`, [ids]);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new AppError(404, "Inventory item not found", { missing });
  }

  const shortages = ids
    .map((id) => ({ itemId: id, required: totals.get(id)!, available: byId.get(id)!.quantity }))
    .filter((s) => s.available < s.required);
  if (shortages.length > 0) {
    throw new AppError(409, "Insufficient inventory", { shortages });
  }

  const updated: InventoryItem[] = [];
  for (const id of ids) {
    const res = await q.query<Row>(
      `UPDATE inventory_items SET quantity = quantity - $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, totals.get(id)!],
    );
    updated.push(toItem(res.rows[0]!));
  }
  return updated;
}
