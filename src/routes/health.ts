import type { FastifyInstance } from "fastify";
import type { AppEnv } from "../config/env.js";
import { getDb } from "../db/index.js";

export function registerHealthRoutes(app: FastifyInstance, env: AppEnv): void {
  app.get("/", () => ({
    message: "Welcome to the Relay Api Bot! Use /health to check the bot's status.",
  }));

  app.get("/health", () => ({
    status: "healthy",
    checks: { server: "running" },
    uptime: Math.floor(process.uptime()),
  }));

  app.get("/status", async () => {
    let database: "connected" | "disconnected" = "disconnected";

    try {
      await getDb().$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "disconnected";
    }

    return {
      version: "0.1.0",
      environment: env.NODE_ENV,
      database,
    };
  });
}
