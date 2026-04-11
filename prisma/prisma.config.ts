/**
 * Prisma Configuration (v7+)
 *
 * Provides the database connection URL for migrations.
 * In Prisma 7, the URL is no longer set in `schema.prisma` directly —
 * it lives here and is passed to the Prisma Client at runtime.
 */

import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, "schema.prisma"),
  migrate: {
    async url() {
      return process.env.DATABASE_URL ?? "";
    },
  },
});
