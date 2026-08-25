const { Pool } = require("pg");
const { checkServerIdentity } = require("node:tls");
const { loadEnvConfig } = require("@next/env");

// Arma el Pool de Postgres para los scripts de mantenimiento (migraciones, bootstrap
// de usuarios). Comparte la config SSL y las validaciones de producción con
// lib/db/postgres.ts; vive duplicado acá porque ese archivo es TypeScript y estos
// scripts corren con `node` plano, sin paso de build.
function createPgPool() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }

  const databaseSsl = process.env.DATABASE_SSL === "true" || databaseUrl.includes("sslmode=require");
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
  const databaseCa = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
  const databaseTlsServerName = process.env.DATABASE_TLS_SERVER_NAME;

  if (process.env.NODE_ENV === "production") {
    if (!rejectUnauthorized) {
      console.error("Configuración insegura: DATABASE_SSL_REJECT_UNAUTHORIZED=false no está permitida en producción.");
      process.exit(1);
    }
    if (!databaseSsl) {
      console.error("Configuración insegura: TLS PostgreSQL es obligatorio en producción.");
      process.exit(1);
    }
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSsl
      ? {
          rejectUnauthorized,
          ca: databaseCa,
          // Node valida checkServerIdentity si la clave está presente, aunque sea undefined:
          // solo se agrega cuando de verdad hay un hostname para validar.
          ...(databaseTlsServerName
            ? { checkServerIdentity: (_host, certificate) => checkServerIdentity(databaseTlsServerName, certificate) }
            : {}),
        }
      : undefined,
  });

  return { pool, databaseUrl };
}

module.exports = { createPgPool };
