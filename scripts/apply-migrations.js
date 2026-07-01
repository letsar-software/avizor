const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
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
  ];

  for (const migration of migrations) {
    await applyMigration(migration);
  }

  const rules = await pool.query(
    "select count(*)::int as total from reglas_agronomicas where cultivo = $1 and activa = true",
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
