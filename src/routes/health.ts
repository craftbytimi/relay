import type { FastifyInstance } from "fastify";
import type { AppEnv } from "../config/env.js";
import { getDb } from "../db/index.js";
import { getBot } from "../bot/client.js";

export function registerHealthRoutes(app: FastifyInstance, env: AppEnv): void {
  app.get("/", () => ({
    message: "Welcome to the Relay Api Bot! Use /health to check the bot's status.",
  }));

  app.get("/health", () => {
    const bot = getBot();
    const discord = bot?.isReady() ? "connected" : "disconnected";

    const healthy = discord === "connected" || !env.DISCORD_BOT_TOKEN;

    return {
      status: healthy ? "healthy" : "degraded",
      checks: {
        server: "running",
        discord,
      },
      uptime: Math.floor(process.uptime()),
    };
  });

  app.get("/status", async (_request, reply) => {
    let database: "connected" | "disconnected" = "disconnected";

    try {
      await getDb().$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "disconnected";
    }

    const bot = getBot();
    const discord = bot?.isReady() ? "connected" : "disconnected";
    const allHealthy = database === "connected" && (discord === "connected" || !env.DISCORD_BOT_TOKEN);

    if (!allHealthy) {
      reply.status(503);
    }

    return {
      version: "0.1.0",
      environment: env.NODE_ENV,
      database,
      discord,
    };
  });
}
