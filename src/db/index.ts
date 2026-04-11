import { PrismaClient } from "@prisma/client";

let _db: PrismaClient | null = null;

export function getDb(): PrismaClient {
  if (!_db) {
    _db = new PrismaClient();
  }
  return _db;
}

export { PrismaClient };
