const fs = require("fs");
const path = require("path");
const { createPgPool } = require("./lib/database-pool");

const historyMigration = "db/migrations/021_schema_migrations.sql";

function readSql(migration) {
  return fs.readFileSync(path.join(process.cwd(), migration), "utf8").replace(/^\uFEFF/, "");
}

async function tableExists(client, tableName) {
  const result = await client.query("select to_regclass($1) as table_name", [tableName]);
  return Boolean(result.rows[0].table_name);
}

async function applyMigration(client, migration, bootstrap = false) {
  const filename = path.basename(migration);
  if (!bootstrap) {
    const applied = await client.query("select 1 from public.schema_migrations where filename = $1", [filename]);
    if (applied.rowCount > 0) {
      console.log(`skipped ${migration}`);
      return;
    }
  }

  await client.query("begin");
  try {
    await client.query(readSql(migration));
    await client.query("insert into public.schema_migrations (filename) values ($1)", [filename]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
  console.log(`applied ${migration}`);
}

async function runMigrations(client) {
  if (!(await tableExists(client, "public.schema_migrations"))) {
    await applyMigration(client, historyMigration, true);
  }

  if (await tableExists(client, "public.reglas_agronomicas")) {
    await applyMigration(client, "db/migrations/003_dedupe_reglas_agronomicas.sql");
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
    "db/migrations/010_usuarios_admin.sql",
    "db/migrations/011_reglas_aplicabilidad.sql",
    "db/migrations/012_plagas.sql",
    "db/migrations/013_soja_plagas_rules.sql",
    "db/migrations/014_empresas_api_keys.sql",
    "db/migrations/015_modelos_fenologicos.sql",
    "db/migrations/016_retira_columnas_plagas_reglas_agronomicas.sql",
    "db/migrations/017_invitaciones_admin.sql",
    "db/migrations/018_api_key_scopes_check.sql",
    "db/migrations/019_privacy_retention.sql",
    "db/migrations/020_novedades_suscripcion_baja.sql",
    historyMigration,
  ];

  for (const migration of migrations) {
    await applyMigration(client, migration);
  }

  const rules = await client.query(
    "select count(*)::int as total from reglas_agronomicas where cultivo = $1 and activa = true and estado_regla in ('validada', 'experimental')",
    ["soja"],
  );
  console.log(`active_soja_rules ${rules.rows[0].total}`);
}

async function main() {
  const { pool } = createPgPool();
  try {
    const client = await pool.connect();
    try {
      await runMigrations(client);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error("migration_failed");
  process.exitCode = 1;
});
