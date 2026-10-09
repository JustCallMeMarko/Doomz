import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import type { DB } from "./db/client";
import { AppError } from "./lib/errors";
import type { LLM } from "./lib/llm";
import { chatRoutes } from "./routes/chat";
import { elementRoutes } from "./routes/elements";
import { inventoryRoutes } from "./routes/inventory";
import { planRoutes } from "./routes/plans";

export type AppDeps = {
  db: DB;
  llm: LLM;
  corsOrigin?: string | string[];
  logRequests?: boolean;
};

export function createApp(deps: AppDeps) {
  const app = new Hono();

  if (deps.logRequests) app.use(logger());
  app.use(cors({ origin: deps.corsOrigin ?? "*", exposeHeaders: ["X-Thread-Id"] }));

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: err.message, ...(err.details !== undefined && { details: err.details }) }, err.status);
    }
    if (err instanceof HTTPException) return err.getResponse();
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });
  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app
    .get("/health", (c) => c.json({ status: "ok" }))
    .route("/api/plans", planRoutes(deps))
    .route("/api/chat", chatRoutes(deps))
    .route("/api/elements", elementRoutes(deps))
    .route("/api/inventory", inventoryRoutes(deps));
}

/** Route types for Hono's RPC client (`hc<AppType>`) in doomz-client. */
export type AppType = ReturnType<typeof createApp>;
