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
  containerId: string | null;
  updatedAt: Date;
};

export const CONTAINER_COLORS = ["red", "orange", "amber", "green", "teal", "sky", "blue", "violet", "pink"] as const;
export type ContainerColor = (typeof CONTAINER_COLORS)[number];

/** Stable fallback color for containers created before colors existed. */
function defaultColor(id: string): ContainerColor {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CONTAINER_COLORS[h % CONTAINER_COLORS.length]!;
}

export type InventoryContainer = {
  id: string;
  name: string;
  description: string;
  location: string;
  color: ContainerColor;
  itemCount?: number;
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export type ItemAmount = { itemId: string; quantity: number };

type Row = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  capacity: number;
  level: number;
  container_id: string | null;
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
  containerId: r.container_id,
  updatedAt: r.updated_at,
});

const toContainer = (r: ContainerRow): InventoryContainer => ({
  id: r.id,
  name: r.name,
  description: r.description,
  location: r.location,
  color: CONTAINER_COLORS.includes(r.color as ContainerColor) ? (r.color as ContainerColor) : defaultColor(r.id),
  ...(r.item_count !== undefined && { itemCount: r.item_count }),
});

export type InventoryFilter = { category?: string; container?: string };

export async function listInventory(q: Queryable, filter: InventoryFilter = {}) {
  const container = filter.container;
  const { rows } = await q.query<Row>(
    `SELECT * FROM inventory_items
     WHERE ($1::text IS NULL OR lower(category) = lower($1))
       AND ($2::text IS NULL
         OR ($2 = 'unassigned' AND container_id IS NULL)
         OR ($2 <> 'unassigned' AND container_id = $2))
     ORDER BY category, name`,
    [filter.category ?? null, container ?? null],
  );
  return rows.map(toItem);
}

type ContainerRow = {
  id: string;
  name: string;
  description: string;
  location: string;
  color: string | null;
  item_count?: number;
};

export async function listContainers(q: Queryable) {
  const { rows } = await q.query<ContainerRow>(
    `SELECT c.*, (SELECT count(*)::int FROM inventory_items i WHERE i.container_id = c.id) AS item_count
     FROM inventory_containers c ORDER BY c.name`,
  );
  return rows.map(toContainer);
}

export async function getContainer(q: Queryable, id: string) {
  const { rows } = await q.query<ContainerRow>(`SELECT * FROM inventory_containers WHERE id = $1`, [id]);
  return rows[0] ? toContainer(rows[0]) : null;
}

/** Deletes an empty container; containers that still hold items are rejected. */
export async function deleteContainer(q: Queryable, id: string) {
  const { rows: held } = await q.query<{ n: number }>(`SELECT count(*)::int AS n FROM inventory_items WHERE container_id = $1`, [id]);
  if (held[0]!.n > 0) throw new AppError(409, "Container is not empty", { itemCount: held[0]!.n });
  const { rows } = await q.query(`DELETE FROM inventory_containers WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

async function assertContainer(q: Queryable, id: string) {
  const container = await getContainer(q, id);
  if (!container) throw notFound("Container");
  return container;
}

export type ContainerInput = { id?: string; name: string; description?: string; location?: string; color?: ContainerColor };

export async function createContainer(q: Queryable, input: ContainerInput) {
  const id = (input.id?.trim() || slugify(input.name)).toLowerCase();
  try {
    const { rows } = await q.query<ContainerRow>(
      `INSERT INTO inventory_containers (id, name, description, location, color) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, input.name.trim(), input.description ?? "", input.location ?? "", input.color ?? null],
    );
    return toContainer(rows[0]!);
  } catch (e) {
    if (e instanceof Error && /duplicate key/.test(e.message)) throw new AppError(409, "Container id already exists", { id });
    throw e;
  }
}

export type CreateItemInput = {
  id?: string;
  name: string;
  category: string;
  unit?: string;
  quantity?: number;
  capacity: number;
  level?: number;
  containerId?: string | null;
};

export async function createItem(q: Queryable, input: CreateItemInput) {
  const id = (input.id?.trim() || slugify(input.name)).toLowerCase();
  const quantity = input.quantity ?? 0;
  if (quantity > input.capacity) {
    throw new AppError(409, "Quantity exceeds item capacity", { quantity, capacity: input.capacity });
  }
  if (input.containerId) await assertContainer(q, input.containerId);
  try {
    const { rows } = await q.query<Row>(
      `INSERT INTO inventory_items (id, name, category, unit, quantity, capacity, level, container_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, input.name.trim(), input.category.trim(), input.unit ?? "units", quantity, input.capacity, input.level ?? 1, input.containerId ?? null],
    );
    return toItem(rows[0]!);
  } catch (e) {
    if (e instanceof Error && /duplicate key/.test(e.message)) throw new AppError(409, "Item id already exists", { id });
    throw e;
  }
}

/** Deletes an item and drops it from any plan step that required it. Call inside a transaction. */
export async function deleteInventoryItem(q: Queryable, id: string) {
  await q.query(
    `UPDATE plan_steps
     SET required_items = COALESCE(
       (SELECT jsonb_agg(e) FROM jsonb_array_elements(required_items) e WHERE e->>'itemId' <> $1), '[]'::jsonb)
     WHERE required_items @> jsonb_build_array(jsonb_build_object('itemId', $1::text))`,
    [id],
  );
  const { rows } = await q.query(`DELETE FROM inventory_items WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function getInventoryItem(q: Queryable, id: string) {
  const { rows } = await q.query<Row>(`SELECT * FROM inventory_items WHERE id = $1`, [id]);
  return rows[0] ? toItem(rows[0]) : null;
}

export type InventoryPatch = {
  delta?: number;
  quantity?: number;
  capacity?: number;
  level?: number;
  containerId?: string | null;
};

export async function updateInventoryItem(q: Queryable, id: string, patch: InventoryPatch) {
  const item = await getInventoryItem(q, id);
  if (!item) throw notFound("Inventory item");

  const capacity = patch.capacity ?? item.capacity;
  const quantity = patch.quantity ?? item.quantity + (patch.delta ?? 0);
  const level = patch.level ?? item.level;
  const containerId = patch.containerId === undefined ? item.containerId : patch.containerId;
  if (containerId) await assertContainer(q, containerId);

  if (quantity < 0) {
    throw new AppError(409, "Insufficient quantity", { itemId: id, available: item.quantity, requested: -(patch.delta ?? 0) });
  }
  if (quantity > capacity) {
    throw new AppError(409, "Quantity exceeds item capacity", { itemId: id, quantity, capacity });
  }

  const { rows } = await q.query<Row>(
    `UPDATE inventory_items SET quantity = $2, capacity = $3, level = $4, container_id = $5, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, quantity, capacity, level, containerId],
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
