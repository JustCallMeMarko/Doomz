import type { Queryable } from "../db/client";

export const PERSONAS = ["general", "medic", "agronomist", "engineer", "arbiter"] as const;
export type Persona = (typeof PERSONAS)[number];

export const PERSONA_PROMPTS: Record<Persona, string> = {
  general:
    "You are Doomz, an offline survival and civilization-rebuilding assistant. Give practical, safe, step-by-step guidance that works without internet, grid power or modern supply chains.",
  medic:
    "You are Doomz acting as a field medic. Provide emergency first aid, triage and sanitation guidance using limited supplies. Always flag when a situation is life-threatening and prioritise safety.",
  agronomist:
    "You are Doomz acting as an agronomist. Advise on soil health, seed preservation, crop rotation, food preservation and post-grid farming.",
  engineer:
    "You are Doomz acting as an off-grid engineer. Advise on shelter construction, water filtration, solar and DC power, and improvised tools. Mention safety hazards.",
  arbiter:
    "You are Doomz acting as an arbiter. Help with resource rationing, barter agreements, conflict resolution and fair local governance.",
};

export type ChatRole = "user" | "assistant";

export type ChatThread = {
  id: string;
  title: string;
  persona: Persona;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt: Date };

type ThreadRow = { id: string; title: string; persona: Persona; created_at: Date; updated_at: Date };
type MessageRow = { id: string; thread_id: string; role: ChatRole; content: string; created_at: Date };

const toThread = (r: ThreadRow): ChatThread => ({
  id: r.id,
  title: r.title,
  persona: r.persona,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toMessage = (r: MessageRow): ChatMessage => ({ id: r.id, role: r.role, content: r.content, createdAt: r.created_at });

export async function createThread(q: Queryable, title: string, persona: Persona) {
  const { rows } = await q.query<ThreadRow>(
    `INSERT INTO chat_threads (title, persona) VALUES ($1, $2) RETURNING *`,
    [title, persona],
  );
  return toThread(rows[0]!);
}

export async function getThread(q: Queryable, id: string) {
  const { rows } = await q.query<ThreadRow>(`SELECT * FROM chat_threads WHERE id = $1`, [id]);
  return rows[0] ? toThread(rows[0]) : null;
}

export async function touchThread(q: Queryable, id: string, persona?: Persona) {
  await q.query(`UPDATE chat_threads SET updated_at = now(), persona = COALESCE($2, persona) WHERE id = $1`, [id, persona ?? null]);
}

export async function listThreads(q: Queryable) {
  const { rows } = await q.query<ThreadRow & { message_count: number; last_message: string | null }>(
    `SELECT t.*,
       (SELECT count(*)::int FROM chat_messages m WHERE m.thread_id = t.id) AS message_count,
       (SELECT content FROM chat_messages m WHERE m.thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM chat_threads t
     ORDER BY t.updated_at DESC`,
  );
  return rows.map((r) => ({ ...toThread(r), messageCount: r.message_count, lastMessage: r.last_message }));
}

export async function addMessage(q: Queryable, threadId: string, role: ChatRole, content: string) {
  const { rows } = await q.query<MessageRow>(
    `INSERT INTO chat_messages (thread_id, role, content) VALUES ($1, $2, $3) RETURNING *`,
    [threadId, role, content],
  );
  return toMessage(rows[0]!);
}

export async function listMessages(q: Queryable, threadId: string, limit?: number) {
  const { rows } = await q.query<MessageRow>(
    `SELECT * FROM (
       SELECT * FROM chat_messages WHERE thread_id = $1 ORDER BY created_at DESC LIMIT $2
     ) recent ORDER BY created_at ASC`,
    [threadId, limit ?? null],
  );
  return rows.map(toMessage);
}

export async function deleteThread(q: Queryable, id: string) {
  const { affectedRows } = await q.query(`DELETE FROM chat_threads WHERE id = $1`, [id]);
  return (affectedRows ?? 0) > 0;
}
