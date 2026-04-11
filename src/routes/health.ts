import type { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/health", () => ({
    status: "healthy",
    checks: { server: "running" },
    uptime: Math.floor(process.uptime()),
  }));
}
