import type { FastifyBaseLogger } from "fastify";
import pino from "pino";

import type { AppEnv } from "../config/env.js";

export type AppLogger = FastifyBaseLogger;

export function createLogger(env: Pick<AppEnv, "LOG_LEVEL" | "NODE_ENV">): AppLogger {
  return pino({
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { env: env.NODE_ENV, service: "relay" },
  }) as AppLogger;
}
