import { fileURLToPath } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./routes/health.js";
import { installShutdownHandlers } from "./utils/shutdown.js";
import { loadEnv, type AppEnv } from "./config/env.js";
import { createLogger, type AppLogger } from "./utils/logger.js";
import { createBot } from "./bot/client.js";
import { registerReady } from "./bot/events/ready.js";
import { registerInteractionCreate } from "./bot/events/interaction-create.js";
import { registerCommands } from "./bot/register-commands.js";

export interface BuiltApplication {
  app: FastifyInstance;
  env: AppEnv;
  logger: AppLogger;
}

export async function buildApplication(
  options: { env?: AppEnv; logger?: AppLogger } = {},
): Promise<BuiltApplication> {
  const env = options.env ?? loadEnv();
  const logger = options.logger ?? createLogger(env);

  const app = Fastify({
    disableRequestLogging: env.NODE_ENV === "test",
    loggerInstance: logger,
  });

  // Routes
  registerHealthRoutes(app, env);

  return { app, env, logger };
}

export async function startApplication(): Promise<BuiltApplication> {
  const { app, env, logger } = await buildApplication();

  installShutdownHandlers({ app, logger });

  await app.listen({ host: "0.0.0.0", port: env.PORT });
  logger.info({ port: env.PORT }, "Relay HTTP server started");

  // Start Discord bot if token is configured
  if (env.DISCORD_BOT_TOKEN && env.DISCORD_CLIENT_ID) {
    const bot = createBot();

    // Register event handlers
    registerReady(bot);
    registerInteractionCreate(bot);

    // Register slash commands with Discord API
    await registerCommands(
      env.DISCORD_BOT_TOKEN,
      env.DISCORD_CLIENT_ID,
      env.DISCORD_GUILD_ID,
    );

    // Connect to Discord
    await bot.login(env.DISCORD_BOT_TOKEN);

    logger.info("Discord bot started");
  } else {
    logger.warn("DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID not set — bot disabled");
  }

  return { app, env, logger };
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const fallbackLogger = createLogger({ LOG_LEVEL: "error", NODE_ENV: "development" });

  void startApplication().catch((error: unknown) => {
    fallbackLogger.fatal({ err: error }, "Relay failed to start");
    process.exit(1);
  });
}
