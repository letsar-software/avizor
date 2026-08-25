import { Pool } from "pg";
import type { QueryResultRow } from "pg";
import { checkServerIdentity } from "node:tls";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL === "true" || DATABASE_URL?.includes("sslmode=require");
const DATABASE_SSL_REJECT_UNAUTHORIZED = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
const DATABASE_CA = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
const DATABASE_TLS_SERVER_NAME = process.env.DATABASE_TLS_SERVER_NAME;

declare global {
  var avizorPgPool: Pool | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(DATABASE_URL);
}

export function validateDatabaseSecurityConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "production") return;
  if (env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
    throw new Error("Configuración insegura: DATABASE_SSL_REJECT_UNAUTHORIZED=false no está permitida en producción.");
  }
  const sslEnabled = env.DATABASE_SSL === "true" || env.DATABASE_URL?.includes("sslmode=require");
  if (!sslEnabled) {
    throw new Error("Configuración insegura: TLS PostgreSQL es obligatorio en producción.");
  }
}

export function getPool() {
  validateDatabaseSecurityConfig();
  if (!DATABASE_URL) {
    throw new Error("Falta la variable DATABASE_URL");
  }

  if (!global.avizorPgPool) {
    global.avizorPgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_SSL
        ? {
            rejectUnauthorized: DATABASE_SSL_REJECT_UNAUTHORIZED,
            ca: DATABASE_CA,
            // Node valida checkServerIdentity si la clave está presente, aunque sea undefined:
            // solo se agrega cuando de verdad hay un hostname para validar.
            ...(DATABASE_TLS_SERVER_NAME
              ? { checkServerIdentity: (_host: string, certificate: Parameters<typeof checkServerIdentity>[1]) => checkServerIdentity(DATABASE_TLS_SERVER_NAME, certificate) }
              : {}),
          }
        : undefined,
      max: 5,
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 10000),
    });
  }

  return global.avizorPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

