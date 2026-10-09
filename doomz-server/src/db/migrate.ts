import type { PGlite } from "@electric-sql/pglite";

const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'General',
  status      text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text NOT NULL DEFAULT '',
  position       integer NOT NULL,
  completed      boolean NOT NULL DEFAULT false,
  completed_at   timestamptz,
  required_items jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS plan_steps_plan_idx ON plan_steps (plan_id, position);

CREATE TABLE IF NOT EXISTS chat_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  persona    text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS elements (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  symbol        text NOT NULL,
  category      text NOT NULL,
  description   text NOT NULL DEFAULT '',
  properties    jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_base       boolean NOT NULL DEFAULT false,
  discovered    boolean NOT NULL DEFAULT false,
  discovered_at timestamptz
);

CREATE TABLE IF NOT EXISTS element_recipes (
  ingredient_a text NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
  ingredient_b text NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
  result_id    text NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
  PRIMARY KEY (ingredient_a, ingredient_b),
  CHECK (ingredient_a <= ingredient_b)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  category   text NOT NULL,
  unit       text NOT NULL DEFAULT 'units',
  quantity   integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  capacity   integer NOT NULL CHECK (capacity > 0),
  level      integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity <= capacity)
);

CREATE TABLE IF NOT EXISTS app_meta (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inventory_containers (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  location    text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS container_id text REFERENCES inventory_containers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS inventory_items_container_idx ON inventory_items (container_id);
`;

export async function migrate(db: PGlite) {
  await db.exec(SCHEMA);
}
