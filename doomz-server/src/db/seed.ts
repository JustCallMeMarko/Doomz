import type { PGlite } from "@electric-sql/pglite";

type SeedElement = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  properties?: Record<string, unknown>;
  isBase?: boolean;
};

export const SEED_ELEMENTS: SeedElement[] = [
  { id: "fire", name: "Fire", symbol: "Fi", category: "Primal", description: "Heat, light and transformation.", properties: { temperature: "hot" }, isBase: true },
  { id: "water", name: "Water", symbol: "Wa", category: "Primal", description: "The basis of all life. Purify before drinking.", properties: { state: "liquid" }, isBase: true },
  { id: "earth", name: "Earth", symbol: "Ea", category: "Primal", description: "Soil, rock and minerals beneath your feet.", properties: { state: "solid" }, isBase: true },
  { id: "air", name: "Air", symbol: "Ai", category: "Primal", description: "Wind and breath; drives combustion.", properties: { state: "gas" }, isBase: true },
  { id: "steam", name: "Steam", symbol: "St", category: "Energy", description: "Pressurised vapour that can drive turbines and sterilise tools.", properties: { state: "gas", temperature: "hot" } },
  { id: "lava", name: "Lava", symbol: "Lv", category: "Material", description: "Molten rock.", properties: { state: "liquid", temperature: "extreme" } },
  { id: "mud", name: "Mud", symbol: "Md", category: "Material", description: "Wet earth used for daub walls and simple bricks.", properties: { state: "paste" } },
  { id: "energy", name: "Energy", symbol: "En", category: "Energy", description: "Raw power harnessed from combustion and wind.", properties: {} },
  { id: "dust", name: "Dust", symbol: "Du", category: "Material", description: "Fine particles carried by the wind.", properties: { state: "solid" } },
  { id: "rain", name: "Rain", symbol: "Rn", category: "Nature", description: "Collectable fresh water from the sky.", properties: { state: "liquid" } },
  { id: "stone", name: "Stone", symbol: "Sn", category: "Material", description: "Durable building and tool material.", properties: { hardness: "high" } },
  { id: "obsidian", name: "Obsidian", symbol: "Ob", category: "Material", description: "Volcanic glass that holds a razor edge.", properties: { hardness: "high", sharp: true } },
  { id: "sand", name: "Sand", symbol: "Sa", category: "Material", description: "Weathered stone; key to filtration and glass.", properties: { state: "granular" } },
  { id: "glass", name: "Glass", symbol: "Gl", category: "Technology", description: "Transparent material for lenses, jars and greenhouses.", properties: { transparent: true } },
  { id: "clay", name: "Clay", symbol: "Cl", category: "Material", description: "Mouldable earth for pottery and bricks.", properties: { mouldable: true } },
  { id: "brick", name: "Brick", symbol: "Br", category: "Technology", description: "Fired clay blocks for durable shelter.", properties: { hardness: "medium" } },
  { id: "metal", name: "Metal", symbol: "Mt", category: "Technology", description: "Smelted ore for tools, wire and machinery.", properties: { conductive: true } },
  { id: "plant", name: "Plant", symbol: "Pl", category: "Nature", description: "Crops and vegetation — food, fibre and medicine.", properties: { living: true } },
  { id: "tool", name: "Tool", symbol: "Tl", category: "Technology", description: "Basic implements that multiply human effort.", properties: {} },
  { id: "electricity", name: "Electricity", symbol: "El", category: "Energy", description: "Generated current to power lights, radios and pumps.", properties: { conductive: true } },
];

export const SEED_RECIPES: [string, string, string][] = [
  ["fire", "water", "steam"],
  ["earth", "fire", "lava"],
  ["earth", "water", "mud"],
  ["air", "fire", "energy"],
  ["air", "earth", "dust"],
  ["air", "water", "rain"],
  ["air", "lava", "stone"],
  ["lava", "water", "obsidian"],
  ["air", "stone", "sand"],
  ["fire", "sand", "glass"],
  ["mud", "sand", "clay"],
  ["clay", "fire", "brick"],
  ["fire", "stone", "metal"],
  ["earth", "rain", "plant"],
  ["metal", "stone", "tool"],
  ["energy", "metal", "electricity"],
  ["metal", "steam", "electricity"],
];

export const SEED_CONTAINERS = [
  { id: "main-crate", name: "Main Storage Crate", description: "General-purpose stockpile crate.", location: "Shelter floor" },
  { id: "med-cabinet", name: "Medical Cabinet", description: "Locked cabinet for triage supplies.", location: "Shelter wall" },
];

const CONTAINER_FOR_CATEGORY: Record<string, string> = { Medical: "med-cabinet" };

export const SEED_INVENTORY = [
  { id: "water", name: "Purified Water", category: "Water", unit: "liters", quantity: 60, capacity: 200 },
  { id: "canned-food", name: "Canned Food", category: "Food", unit: "cans", quantity: 40, capacity: 120 },
  { id: "rice", name: "Rice", category: "Food", unit: "kg", quantity: 10, capacity: 50 },
  { id: "seeds", name: "Seed Packets", category: "Agriculture", unit: "packets", quantity: 15, capacity: 100 },
  { id: "medkit", name: "First Aid Kit", category: "Medical", unit: "kits", quantity: 2, capacity: 10 },
  { id: "antiseptic", name: "Antiseptic", category: "Medical", unit: "bottles", quantity: 4, capacity: 20 },
  { id: "bandages", name: "Bandages", category: "Medical", unit: "rolls", quantity: 12, capacity: 50 },
  { id: "batteries", name: "Batteries", category: "Energy", unit: "units", quantity: 24, capacity: 100 },
  { id: "fuel", name: "Fuel", category: "Energy", unit: "liters", quantity: 20, capacity: 100 },
  { id: "timber", name: "Timber", category: "Materials", unit: "planks", quantity: 30, capacity: 200 },
  { id: "rope", name: "Rope", category: "Materials", unit: "meters", quantity: 25, capacity: 100 },
  { id: "toolkit", name: "Toolkit", category: "Tools", unit: "kits", quantity: 1, capacity: 5 },
];

/** Idempotently inserts reference data. Existing rows are left untouched. */
export async function seed(db: PGlite) {
  await db.transaction(async (tx) => {
    for (const e of SEED_ELEMENTS) {
      await tx.query(
        `INSERT INTO elements (id, name, symbol, category, description, properties, is_base, discovered, discovered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, CASE WHEN $7 THEN now() END)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.name, e.symbol, e.category, e.description, JSON.stringify(e.properties ?? {}), e.isBase ?? false],
      );
    }
    for (const [a, b, result] of SEED_RECIPES) {
      const [x, y] = [a, b].sort() as [string, string];
      await tx.query(
        `INSERT INTO element_recipes (ingredient_a, ingredient_b, result_id) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [x, y, result],
      );
    }
    for (const c of SEED_CONTAINERS) {
      await tx.query(
        `INSERT INTO inventory_containers (id, name, description, location)
         VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.description, c.location],
      );
    }
    for (const i of SEED_INVENTORY) {
      await tx.query(
        `INSERT INTO inventory_items (id, name, category, unit, quantity, capacity, container_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [i.id, i.name, i.category, i.unit, i.quantity, i.capacity, CONTAINER_FOR_CATEGORY[i.category] ?? "main-crate"],
      );
    }
    // One-time backfill for databases seeded before containers existed; afterwards
    // NULL container_id means "not stored in a container".
    const { rows: done } = await tx.query(`SELECT 1 FROM app_meta WHERE key = 'container_backfill_v1'`);
    if (done.length === 0) {
      await tx.query(
        `UPDATE inventory_items SET container_id = CASE WHEN category = 'Medical' THEN 'med-cabinet' ELSE 'main-crate' END
         WHERE container_id IS NULL`,
      );
      await tx.query(`INSERT INTO app_meta (key, value) VALUES ('container_backfill_v1', '1')`);
    }
  });
}
