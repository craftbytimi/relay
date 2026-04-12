/**
 * Prisma Configuration (v7+)
 *
 * Provides the database connection URL for migrations and db push.
 * In Prisma 7, the URL is no longer set in `schema.prisma` directly —
 * it lives here and is passed to the Prisma Client at runtime.
 *
 * Usage:
 *   npx prisma migrate dev --name <name>
 *   npx prisma db push
 *
 * If the env var isn't picked up automatically, pass --url explicitly:
 *   npx prisma migrate dev --name <name> --url "$DATABASE_URL"
 */

import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

loadDotenv({ path: path.resolve(import.meta.dirname, "../.env") });

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, "schema.prisma"),
  migrate: {
    async url() {
      const url = process.env.DATABASE_URL ?? "";
      // Strip surrounding quotes if present (shell-style quoting)
      return url.replace(/^['"]|['"]$/g, "");
    },
  },
});
