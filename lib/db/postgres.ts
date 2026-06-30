import { Pool } from "pg";
import type { QueryResultRow } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL === "true" || DATABASE_URL?.includes("sslmode=require");

declare global {
  var avizorPgPool: Pool | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(DATABASE_URL);
}

export function getPool() {
  if (!DATABASE_URL) {
    throw new Error("Falta la variable DATABASE_URL");
  }

  if (!global.avizorPgPool) {
    global.avizorPgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }

  return global.avizorPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

