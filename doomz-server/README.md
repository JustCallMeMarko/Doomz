# doomz-server

Hono + Bun API for Doomz. Data lives in an embedded PGlite database (`./pgdata`) and AI features talk to a local Ollama server through its OpenAI-compatible API.

```bash
bun install
bun run dev        # http://localhost:3000 (watch mode)
bun test           # in-memory DB + fake LLM
bun run typecheck
```

Configuration (see `.env.example`): `PORT`, `PGDATA_DIR`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `CORS_ORIGIN`.

The schema is created and reference data (elements, recipes, starter inventory) is seeded on startup; seeding never overwrites existing rows.

## API

Errors are returned as `{ "error": string, "details"?: unknown }`. Timestamps are ISO strings.

### Plans — `/api/plans`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/plans` | Filters: `?status=todo\|in_progress\|done`, `?category=Civilization` (case-insensitive) |
| POST | `/api/plans` | `{ title, description?, category?, priority?, status?, steps?: [{ title, description?, completed?, requiredItems?: [{ itemId, quantity }] }] }` |
| GET | `/api/plans/:id` | |
| PATCH | `/api/plans/:id` | Any plan field. Passing `steps` replaces all steps and re-derives `status` unless `status` is also given |
| PATCH | `/api/plans/:id/steps/:stepId` | Body optional: `{ completed?, consumeItems? }`. Omitting `completed` toggles. Plan status is recomputed (none → `todo`, some → `in_progress`, all → `done`). With `consumeItems: true`, completing the step deducts its `requiredItems` atomically (409 on shortage). Returns `{ plan, consumed }` |
| DELETE | `/api/plans/:id` | 204 |

### Chat — `/api/chat`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/chat/stream` | `{ message, threadId?, persona? }` → `text/plain` stream. New threads are created automatically; the id is in the `X-Thread-Id` response header. Personas: `general`, `medic`, `agronomist`, `engineer`, `arbiter`. 502 if the model is unreachable |
| POST | `/api/chat/generate-plan` | `{ prompt, category?, persona?, save? = true }` → `{ saved, plan }` (201 when saved). The model only sees and may reference existing inventory ids |
| GET | `/api/chat/history` | Threads with `messageCount` and `lastMessage` |
| GET | `/api/chat/history/:threadId` | Thread with its `messages` |
| DELETE | `/api/chat/history/:threadId` | 204 |

### Elements — `/api/elements`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/elements` | Filters: `?discovered=true\|false`, `?category=` |
| GET | `/api/elements/:id` | Element plus `recipes` (ways to make it) and `usedIn` (results hidden until discovered) |
| POST | `/api/elements/combine` | `{ elementA, elementB }` → `{ success, result, isNew }`. Both ingredients must be discovered (409) |
| POST | `/api/elements/unlock` | `{ elementId }` → `{ element, isNew }` |

### Inventory — `/api/inventory`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/inventory` | Filter: `?category=` |
| PATCH | `/api/inventory/items/:id` | `{ delta? \| quantity?, capacity?, level? }`. Quantity must stay within `0..capacity` (409) |
| POST | `/api/inventory/consume` | `{ items: [{ itemId, quantity }] }`. All-or-nothing; 409 with `details.shortages` if anything is short |

### Typed client

`AppType` is exported from `src/app.ts` for use with Hono's RPC client (`hc<AppType>("http://localhost:3000")`).
