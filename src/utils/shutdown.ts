import type { FastifyInstance, FastifyBaseLogger } from "fastify";

interface ShutdownOptions {
  app: FastifyInstance;
  logger: FastifyBaseLogger;
  timeoutMs?: number;
}

export function installShutdownHandlers({
  app,
  logger,
  timeoutMs = 10_000,
}: ShutdownOptions): void {
  let isShuttingDown = false;

  async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, "Shutdown signal received");

    const timer = setTimeout(() => {
      logger.error({ timeoutMs }, "Shutdown timed out");
      process.exit(1);
    }, timeoutMs);
    timer.unref();

    try {
      await app.close();
      clearTimeout(timer);
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (error: unknown) {
      clearTimeout(timer);
      logger.error({ err: error }, "Shutdown failed");
      process.exit(1);
    }
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
