const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let payload: { error?: string; details?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, payload.error ?? res.statusText, payload.details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ---------- Shared types (mirror doomz-server responses) ----------

export type PlanStatus = "todo" | "in_progress" | "done";
export type PlanPriority = "low" | "medium" | "high";
export type Persona = "general" | "medic" | "agronomist" | "engineer" | "arbiter";
export const PERSONAS: Persona[] = ["general", "medic", "agronomist", "engineer", "arbiter"];

export type RequiredItem = { itemId: string; quantity: number };

export type PlanStep = {
  id: string;
  title: string;
  description: string;
  position: number;
  completed: boolean;
  completedAt: string | null;
  requiredItems: RequiredItem[];
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
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = {
  title: string;
  description?: string;
  category?: string;
  priority?: PlanPriority;
  status?: PlanStatus;
  steps?: { title: string; description?: string; completed?: boolean; requiredItems?: RequiredItem[] }[];
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  capacity: number;
  level: number;
  updatedAt: string;
};

export type Element = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description: string;
  properties: Record<string, unknown>;
  isBase: boolean;
  discovered: boolean;
  discoveredAt: string | null;
};

export type ElementDetail = Element & {
  recipes: { ingredients: string[] }[];
  usedIn: { with: string; result: string | null }[];
};

export type ChatThreadSummary = {
  id: string;
  title: string;
  persona: Persona;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
export type ChatThread = Omit<ChatThreadSummary, "messageCount" | "lastMessage"> & { messages: ChatMessage[] };

export type CombineResult = { success: boolean; result: Element | null; isNew: boolean };
export type GeneratedPlan = { saved: boolean; plan: Plan | PlanInput };

// ---------- Plans ----------

export const listPlans = (filter?: { status?: PlanStatus; category?: string }) =>
  request<Plan[]>(
    `/api/plans${qs({ status: filter?.status, category: filter?.category })}`,
  );
export const createPlan = (input: PlanInput) => request<Plan>("/api/plans", { method: "POST", ...json(input) });
export const updatePlan = (id: string, patch: Partial<PlanInput>) =>
  request<Plan>(`/api/plans/${id}`, { method: "PATCH", ...json(patch) });
export const deletePlan = (id: string) => request<void>(`/api/plans/${id}`, { method: "DELETE" });
export const togglePlanStep = (planId: string, stepId: string, body: { completed?: boolean; consumeItems?: boolean } = {}) =>
  request<{ plan: Plan; consumed: InventoryItem[] }>(`/api/plans/${planId}/steps/${stepId}`, { method: "PATCH", ...json(body) });

// ---------- Chat ----------

/** Streams the assistant reply, invoking `onDelta` per chunk. Returns the thread id from `X-Thread-Id`. */
export async function streamChat(
  body: { message: string; threadId?: string; persona?: Persona },
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ threadId: string }> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, { method: "POST", ...json(body), signal });
  if (!res.ok || !res.body) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, payload.error ?? res.statusText);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) onDelta(value);
  }
  return { threadId: res.headers.get("X-Thread-Id") ?? "" };
}

export const generatePlan = (body: { prompt: string; category?: string; persona?: Persona; save?: boolean }) =>
  request<GeneratedPlan>("/api/chat/generate-plan", { method: "POST", ...json(body) });
export const listThreads = () => request<ChatThreadSummary[]>("/api/chat/history");
export const getThread = (threadId: string) => request<ChatThread>(`/api/chat/history/${threadId}`);
export const deleteThread = (threadId: string) => request<void>(`/api/chat/history/${threadId}`, { method: "DELETE" });

// ---------- Elements ----------

export const listElements = (filter?: { discovered?: boolean; category?: string }) =>
  request<Element[]>(
    `/api/elements${qs({ discovered: filter?.discovered === undefined ? undefined : String(filter.discovered), category: filter?.category })}`,
  );
export const getElement = (id: string) => request<ElementDetail>(`/api/elements/${id}`);
export const combineElements = (elementA: string, elementB: string) =>
  request<CombineResult>("/api/elements/combine", { method: "POST", ...json({ elementA, elementB }) });
export const unlockElement = (elementId: string) =>
  request<{ element: Element; isNew: boolean }>("/api/elements/unlock", { method: "POST", ...json({ elementId }) });

// ---------- Inventory ----------

export const listInventory = (category?: string) => request<InventoryItem[]>(`/api/inventory${qs({ category })}`);
export const updateInventoryItem = (id: string, patch: { delta?: number; quantity?: number; capacity?: number; level?: number }) =>
  request<InventoryItem>(`/api/inventory/items/${id}`, { method: "PATCH", ...json(patch) });
export const consumeItems = (items: RequiredItem[]) =>
  request<{ items: InventoryItem[] }>("/api/inventory/consume", { method: "POST", ...json({ items }) });

export const health = () => request<{ status: string }>("/health");

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined));
  const s = search.toString();
  return s ? `?${s}` : "";
}
