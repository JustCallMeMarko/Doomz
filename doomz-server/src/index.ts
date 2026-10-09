import { createApp } from "./app";
import { createDb } from "./db/client";
import { createOllamaLLM } from "./lib/llm";

const env = process.env;

const db = await createDb(env.PGDATA_DIR ?? "./pgdata");
const llm = createOllamaLLM({
  baseURL: env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
  model: env.OLLAMA_MODEL ?? "llama3.2:3b",
});

const app = createApp({
  db,
  llm,
  corsOrigin: env.CORS_ORIGIN?.split(",").map((o) => o.trim()),
  logRequests: true,
});

const server = Bun.serve({
  port: Number(env.PORT ?? 3000),
  fetch: app.fetch,
  // Local models can take a while to emit the first token.
  idleTimeout: 120,
});

console.log(`doomz-server listening on ${server.url}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
}
