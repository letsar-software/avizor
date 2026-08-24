const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { checkServerIdentity } = require("node:tls");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
const databaseSsl = process.env.DATABASE_SSL === "true" || databaseUrl?.includes("sslmode=require");
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
const databaseCa = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
const databaseTlsServerName = process.env.DATABASE_TLS_SERVER_NAME;

if (!databaseUrl) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
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
        checkServerIdentity: databaseTlsServerName
          ? (_host, certificate) => checkServerIdentity(databaseTlsServerName, certificate)
          : undefined,
      }
    : undefined,
});

function readSql(migration) {
  return fs.readFileSync(path.join(process.cwd(), migration), "utf8").replace(/^\uFEFF/, "");
}

async function tableExists(tableName) {
  const result = await pool.query("select to_regclass($1) as table_name", [tableName]);
  return Boolean(result.rows[0].table_name);
}

async function applyMigration(migration) {
  await pool.query(readSql(migration));
  console.log(`applied ${migration}`);
}

async function main() {
  if (await tableExists("public.reglas_agronomicas")) {
    await applyMigration("db/migrations/003_dedupe_reglas_agronomicas.sql");
  }

  const migrations = [
    "db/migrations/001_mvp_schema.sql",
    "db/migrations/002_consultas_interacciones.sql",
    "db/migrations/003_dedupe_reglas_agronomicas.sql",
    "db/migrations/004_reglas_estado_experimental.sql",
    "db/migrations/005_interesados_consentimiento.sql",
    "db/migrations/006_fenologia_consultas.sql",
    "db/migrations/007_backend_v2.sql",
    "db/migrations/008_security_rate_limits.sql",
    "db/migrations/009_soja_enfermedades_v2.sql",
  ];

  for (const migration of migrations) {
    await applyMigration(migration);
  }

  const rules = await pool.query(
    "select count(*)::int as total from reglas_agronomicas where cultivo = $1 and activa = true and estado_regla in ('validada', 'experimental')",
    ["soja"],
  );
  console.log(`active_soja_rules ${rules.rows[0].total}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
