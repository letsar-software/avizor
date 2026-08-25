const fs = require("fs");
const path = require("path");
const { createPgPool } = require("./lib/database-pool");

const { pool } = createPgPool();

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
    "db/migrations/010_usuarios_admin.sql",
    "db/migrations/011_reglas_aplicabilidad.sql",
    "db/migrations/012_plagas.sql",
    "db/migrations/013_soja_plagas_rules.sql",
    "db/migrations/014_empresas_api_keys.sql",
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
