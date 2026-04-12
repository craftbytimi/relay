import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApplication } from "../src/app.js";

describe("health routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it("GET / returns welcome message", async () => {
    const application = await buildApplication({
      env: { LOG_LEVEL: "silent", NODE_ENV: "test", PORT: 3000 },
    });
    app = application.app;

    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.json().message).toContain("Relay");
  });

  it("GET /health returns status with discord check", async () => {
    const application = await buildApplication({
      env: { LOG_LEVEL: "silent", NODE_ENV: "test", PORT: 3000 },
    });
    app = application.app;

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "healthy",
      checks: {
        server: "running",
        discord: "disconnected",
      },
    });
    expect(response.json().uptime).toEqual(expect.any(Number));
  });
});
