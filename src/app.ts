import { fileURLToPath } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./routes/health.js";
import { installShutdownHandlers } from "./utils/shutdown.js";
import { loadEnv, type AppEnv } from "./config/env.js";
import { createLogger, type AppLogger } from "./utils/logger.js";

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
  registerHealthRoutes(app);

  return { app, env, logger };
}

export async function startApplication(): Promise<BuiltApplication> {
  const { app, env, logger } = await buildApplication();

  installShutdownHandlers({ app, logger });

  await app.listen({ host: "0.0.0.0", port: env.PORT });
  logger.info({ port: env.PORT }, "Relay HTTP server started");

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
