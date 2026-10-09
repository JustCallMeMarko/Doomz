import { beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { createDb } from "../src/db/client";
import type { LLM, LLMMessage } from "../src/lib/llm";

class FakeLLM implements LLM {
  chunks = ["Boil ", "water ", "for one minute."];
  json = "";
  fail = false;
  lastMessages: LLMMessage[] = [];

  async *streamChat(messages: LLMMessage[]) {
    this.lastMessages = messages;
    if (this.fail) throw new Error("connect ECONNREFUSED");
    for (const c of this.chunks) yield c;
  }
  async completeJSON(messages: LLMMessage[]) {
    this.lastMessages = messages;
    if (this.fail) throw new Error("connect ECONNREFUSED");
    return this.json;
  }
}

let llm: FakeLLM;
let app: ReturnType<typeof createApp>;

type TestResponse = Omit<Response, "json"> & { json(): Promise<any> };

const req = async (method: string, path: string, body?: unknown): Promise<TestResponse> =>
  await app.request(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(async () => {
  llm = new FakeLLM();
  app = createApp({ db: await createDb(), llm });
});

describe("plans", () => {
  const newPlan = {
    title: "Build rain catchment",
    category: "Civilization",
    steps: [
      { title: "Collect tarp", requiredItems: [{ itemId: "rope", quantity: 10 }] },
      { title: "Build frame", requiredItems: [{ itemId: "timber", quantity: 8 }] },
    ],
  };

  test("CRUD and filtering", async () => {
    const created = await req("POST", "/api/plans", newPlan);
    expect(created.status).toBe(201);
    const plan = await created.json();
    expect(plan.status).toBe("todo");
    expect(plan.steps).toHaveLength(2);
    expect(plan.progress).toEqual({ completed: 0, total: 2 });

    await req("POST", "/api/plans", { title: "Herb garden", category: "Food & Agriculture" });

    expect(await (await req("GET", "/api/plans")).json()).toHaveLength(2);
    expect(await (await req("GET", "/api/plans?category=civilization")).json()).toHaveLength(1);
    expect(await (await req("GET", "/api/plans?status=done")).json()).toHaveLength(0);
    expect((await req("GET", "/api/plans?status=bogus")).status).toBe(400);

    const patched = await (await req("PATCH", `/api/plans/${plan.id}`, { title: "Rain catchment v2", priority: "high" })).json();
    expect(patched.title).toBe("Rain catchment v2");
    expect(patched.priority).toBe("high");
    expect(patched.steps).toHaveLength(2);

    expect((await req("GET", `/api/plans/${plan.id}`)).status).toBe(200);
    expect((await req("DELETE", `/api/plans/${plan.id}`)).status).toBe(204);
    expect((await req("GET", `/api/plans/${plan.id}`)).status).toBe(404);
    expect((await req("DELETE", `/api/plans/${plan.id}`)).status).toBe(404);
    expect((await req("GET", "/api/plans/not-a-uuid")).status).toBe(404);
  });

  test("rejects invalid bodies and unknown inventory items", async () => {
    expect((await req("POST", "/api/plans", { title: "" })).status).toBe(400);
    expect((await req("POST", "/api/plans", { title: "x", steps: [{ title: "y", requiredItems: [{ itemId: "unobtainium", quantity: 1 }] }] })).status).toBe(400);
  });

  test("step toggles drive plan status", async () => {
    const plan = await (await req("POST", "/api/plans", newPlan)).json();
    const [s1, s2] = plan.steps;

    let res = await (await req("PATCH", `/api/plans/${plan.id}/steps/${s1.id}`)).json();
    expect(res.plan.status).toBe("in_progress");
    expect(res.plan.steps[0].completed).toBe(true);

    res = await (await req("PATCH", `/api/plans/${plan.id}/steps/${s2.id}`, { completed: true })).json();
    expect(res.plan.status).toBe("done");

    res = await (await req("PATCH", `/api/plans/${plan.id}/steps/${s1.id}`)).json();
    expect(res.plan.status).toBe("in_progress");
    expect(res.plan.steps[0].completedAt).toBeNull();

    expect((await req("PATCH", `/api/plans/${plan.id}/steps/${crypto.randomUUID()}`)).status).toBe(404);
  });

  test("steps can be moved to in_progress", async () => {
    const plan = await (await req("POST", "/api/plans", newPlan)).json();
    expect(plan.steps[0].status).toBe("todo");
    const [s1, s2] = plan.steps;

    let res = await (await req("PATCH", `/api/plans/${plan.id}/steps/${s1.id}`, { status: "in_progress" })).json();
    expect(res.plan.status).toBe("in_progress");
    expect(res.plan.steps[0]).toMatchObject({ status: "in_progress", completed: false });

    res = await (await req("PATCH", `/api/plans/${plan.id}/steps/${s1.id}`, { status: "done" })).json();
    await req("PATCH", `/api/plans/${plan.id}/steps/${s2.id}`, { status: "done" });
    res = await (await req("GET", `/api/plans/${plan.id}`)).json();
    expect(res.status).toBe("done");
    expect(res.steps.every((s: { completed: boolean }) => s.completed)).toBe(true);

    expect((await req("PATCH", `/api/plans/${plan.id}/steps/${s1.id}`, { status: "nope" })).status).toBe(400);
  });

  test("completing a step can consume its required items", async () => {
    const plan = await (await req("POST", "/api/plans", newPlan)).json();
    const res = await req("PATCH", `/api/plans/${plan.id}/steps/${plan.steps[0].id}`, { consumeItems: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consumed).toEqual([expect.objectContaining({ id: "rope", quantity: 15 })]);

    const greedy = await (await req("POST", "/api/plans", {
      title: "Too much",
      steps: [{ title: "Burn it all", requiredItems: [{ itemId: "fuel", quantity: 999 }] }],
    })).json();
    const fail = await req("PATCH", `/api/plans/${greedy.id}/steps/${greedy.steps[0].id}`, { consumeItems: true });
    expect(fail.status).toBe(409);
    const after = await (await req("GET", `/api/plans/${greedy.id}`)).json();
    expect(after.steps[0].completed).toBe(false);
  });
});

describe("inventory", () => {
  test("lists and updates items within capacity", async () => {
    const items = await (await req("GET", "/api/inventory")).json();
    expect(items.find((i: { id: string }) => i.id === "water")).toMatchObject({ quantity: 60, capacity: 200 });
    expect(await (await req("GET", "/api/inventory?category=medical")).json()).toHaveLength(3);

    expect(await (await req("PATCH", "/api/inventory/items/water", { delta: 15 })).json()).toMatchObject({ quantity: 75 });
    expect(await (await req("PATCH", "/api/inventory/items/water", { quantity: 5, level: 2 })).json()).toMatchObject({ quantity: 5, level: 2 });
    expect((await req("PATCH", "/api/inventory/items/water", { delta: -10 })).status).toBe(409);
    expect((await req("PATCH", "/api/inventory/items/water", { quantity: 500 })).status).toBe(409);
    expect(await (await req("PATCH", "/api/inventory/items/water", { capacity: 600, quantity: 500 })).json()).toMatchObject({ quantity: 500 });
    expect((await req("PATCH", "/api/inventory/items/water", { delta: 1, quantity: 1 })).status).toBe(400);
    expect((await req("PATCH", "/api/inventory/items/water", {})).status).toBe(400);
    expect((await req("PATCH", "/api/inventory/items/nope", { delta: 1 })).status).toBe(404);
  });

  test("consume is atomic", async () => {
    const ok = await req("POST", "/api/inventory/consume", { items: [{ itemId: "bandages", quantity: 2 }, { itemId: "bandages", quantity: 1 }] });
    expect(ok.status).toBe(200);
    expect((await ok.json()).items).toEqual([expect.objectContaining({ id: "bandages", quantity: 9 })]);

    const short = await req("POST", "/api/inventory/consume", { items: [{ itemId: "bandages", quantity: 1 }, { itemId: "medkit", quantity: 5 }] });
    expect(short.status).toBe(409);
    expect((await short.json()).details.shortages).toEqual([{ itemId: "medkit", required: 5, available: 2 }]);

    const items = await (await req("GET", "/api/inventory")).json();
    expect(items.find((i: { id: string }) => i.id === "bandages").quantity).toBe(9);

    expect((await req("POST", "/api/inventory/consume", { items: [{ itemId: "ghost", quantity: 1 }] })).status).toBe(404);
  });
});

describe("elements", () => {
  test("lists, combines and unlocks", async () => {
    const all = await (await req("GET", "/api/elements")).json();
    expect(all.length).toBeGreaterThan(4);
    const discovered = await (await req("GET", "/api/elements?discovered=true")).json();
    expect(discovered.map((e: { id: string }) => e.id).sort()).toEqual(["air", "earth", "fire", "water"]);

    let res = await (await req("POST", "/api/elements/combine", { elementA: "Fire", elementB: "earth" })).json();
    expect(res).toMatchObject({ success: true, isNew: true, result: { id: "lava", discovered: true } });
    res = await (await req("POST", "/api/elements/combine", { elementA: "earth", elementB: "fire" })).json();
    expect(res.isNew).toBe(false);

    res = await (await req("POST", "/api/elements/combine", { elementA: "fire", elementB: "fire" })).json();
    expect(res).toEqual({ success: false, result: null, isNew: false });

    expect((await req("POST", "/api/elements/combine", { elementA: "glass", elementB: "fire" })).status).toBe(409);
    expect((await req("POST", "/api/elements/combine", { elementA: "fire", elementB: "nope" })).status).toBe(404);

    const unlocked = await (await req("POST", "/api/elements/unlock", { elementId: "glass" })).json();
    expect(unlocked).toMatchObject({ isNew: true, element: { id: "glass", discovered: true } });
    expect((await req("POST", "/api/elements/unlock", { elementId: "nope" })).status).toBe(404);
  });

  test("element details include recipes", async () => {
    const fire = await (await req("GET", "/api/elements/fire")).json();
    expect(fire.isBase).toBe(true);
    expect(fire.usedIn).toContainEqual({ with: "water", result: null });
    const steam = await (await req("GET", "/api/elements/steam")).json();
    expect(steam.recipes).toEqual([{ ingredients: ["fire", "water"] }]);
    expect((await req("GET", "/api/elements/nope")).status).toBe(404);
  });
});

describe("chat", () => {
  test("streams, persists and continues threads", async () => {
    const res = await req("POST", "/api/chat/stream", { message: "How do I purify water?", persona: "medic" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Boil water for one minute.");
    const threadId = res.headers.get("X-Thread-Id")!;
    expect(threadId).toBeTruthy();
    expect(llm.lastMessages[0]!.content).toContain("field medic");

    llm.chunks = ["Use a sand filter."];
    const second = await req("POST", "/api/chat/stream", { message: "Any other way?", threadId });
    expect(await second.text()).toBe("Use a sand filter.");
    expect(llm.lastMessages.map((m) => m.role)).toEqual(["system", "user", "assistant", "user"]);

    const history = await (await req("GET", "/api/chat/history")).json();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: threadId, persona: "medic", messageCount: 4, lastMessage: "Use a sand filter." });

    const thread = await (await req("GET", `/api/chat/history/${threadId}`)).json();
    expect(thread.messages.map((m: { content: string }) => m.content)).toEqual([
      "How do I purify water?",
      "Boil water for one minute.",
      "Any other way?",
      "Use a sand filter.",
    ]);

    expect((await req("DELETE", `/api/chat/history/${threadId}`)).status).toBe(204);
    expect((await req("DELETE", `/api/chat/history/${threadId}`)).status).toBe(404);
    expect(await (await req("GET", "/api/chat/history")).json()).toHaveLength(0);
  });

  test("returns 502 without creating a thread when the model is down", async () => {
    llm.fail = true;
    expect((await req("POST", "/api/chat/stream", { message: "hello" })).status).toBe(502);
    expect(await (await req("GET", "/api/chat/history")).json()).toHaveLength(0);
    expect((await req("POST", "/api/chat/stream", { message: "hi", threadId: crypto.randomUUID() })).status).toBe(404);
  });

  test("generates and saves a structured plan", async () => {
    llm.json = "```json\n" + JSON.stringify({
      title: "Water security",
      description: "Secure drinking water",
      category: "Water",
      priority: "urgent",
      steps: [
        { title: "Build filter", requiredItems: [{ itemId: "rope", quantity: "2" }, { itemId: "magic", quantity: 1 }] },
        { title: "Boil water" },
      ],
    }) + "\n```";

    const res = await req("POST", "/api/chat/generate-plan", { prompt: "Plan clean water", category: "Civilization" });
    expect(res.status).toBe(201);
    const { saved, plan } = await res.json();
    expect(saved).toBe(true);
    expect(plan).toMatchObject({ title: "Water security", category: "Civilization", priority: "medium", status: "todo" });
    expect(plan.steps[0].requiredItems).toEqual([{ itemId: "rope", quantity: 2 }]);
    expect(plan.steps[1].requiredItems).toEqual([]);
    expect(await (await req("GET", "/api/plans")).json()).toHaveLength(1);

    const draft = await (await req("POST", "/api/chat/generate-plan", { prompt: "again", save: false })).json();
    expect(draft).toMatchObject({ saved: false, plan: { category: "Water" } });
    expect(await (await req("GET", "/api/plans")).json()).toHaveLength(1);

    llm.json = "not json";
    expect((await req("POST", "/api/chat/generate-plan", { prompt: "x" })).status).toBe(502);
  });
});

describe("containers", () => {
  test("creates items and containers, filters by container", async () => {
    const containers = await (await req("GET", "/api/inventory/containers")).json();
    expect(containers.find((c: { id: string }) => c.id === "main-crate")).toMatchObject({ itemCount: 9 });
    expect(containers.find((c: { id: string }) => c.id === "med-cabinet")).toMatchObject({ itemCount: 3 });

    const crate = await (await req("GET", "/api/inventory/containers/main-crate")).json();
    expect(crate.items).toHaveLength(9);
    expect((await req("GET", "/api/inventory/containers/nope")).status).toBe(404);

    const created = await req("POST", "/api/inventory/containers", { name: "Fuel Drum", location: "Shed" });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ id: "fuel-drum", name: "Fuel Drum" });
    expect((await req("POST", "/api/inventory/containers", { id: "main-crate", name: "Dupe" })).status).toBe(409);

    const item = await req("POST", "/api/inventory/items", {
      name: "Water Purification Tablets",
      category: "Medical",
      unit: "tablets",
      quantity: 50,
      capacity: 100,
      containerId: "med-cabinet",
    });
    expect(item.status).toBe(201);
    expect(await item.json()).toMatchObject({ id: "water-purification-tablets", containerId: "med-cabinet" });

    expect((await req("POST", "/api/inventory/items", { name: "x", category: "y", capacity: 1, containerId: "ghost" })).status).toBe(404);
    expect((await req("POST", "/api/inventory/items", { name: "x", category: "y", capacity: 1, quantity: 5 })).status).toBe(409);

    expect(await (await req("GET", "/api/inventory?container=med-cabinet")).json()).toHaveLength(4);
    expect(await (await req("GET", "/api/inventory?container=unassigned")).json()).toHaveLength(0);

    expect((await req("PATCH", "/api/inventory/items/fuel", { containerId: "fuel-drum" })).json()).resolves
      .toMatchObject({ containerId: "fuel-drum" });
    await req("PATCH", "/api/inventory/items/fuel", { containerId: "fuel-drum" });
    expect((await req("PATCH", "/api/inventory/items/fuel", { containerId: "ghost" })).status).toBe(404);
    expect(await (await req("PATCH", "/api/inventory/items/fuel", { containerId: null })).json()).toMatchObject({ containerId: null });
  });
});
