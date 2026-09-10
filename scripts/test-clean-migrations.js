// BE-001/BE-002: esquema, historial y rollback en PostgreSQL descartable.
// No usa DATABASE_URL del .env ni de Railway.
//
// Uso: npm run db:migrate:clean
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const assert = require("node:assert/strict");
const { CommandError, runCommand } = require("./lib/run-command");
const { createDisposablePostgres } = require("./lib/disposable-postgres");
const { assertCleanSchema, readSchemaSnapshot } = require("./lib/clean-schema");

const postgres = createDisposablePostgres({
  container: "avizor-pg-migrate-test",
  image: "postgres:16",
  user: "avizor",
  password: "avizor",
  database: "avizor",
  hostPort: "54329",
});

function applyMigrations(databaseUrl, options = {}) {
  const result = runCommand(
    options.cwd ? process.execPath : "npm",
    options.cwd ? [path.join(__dirname, "apply-migrations.js")] : ["run", "db:migrate"],
    {
      ...options,
      capture: true,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DATABASE_SSL: "false",
        NODE_ENV: "development",
      },
    },
  );
  if (!options.allowFailure) process.stdout.write(result.stdout);
  return result;
}

function historySnapshot() {
  return postgres.query("select coalesce(json_agg(h order by filename), '[]'::json) from public.schema_migrations h");
}

function assertHistory() {
  const history = JSON.parse(historySnapshot());
  const files = fs.readdirSync(path.join(__dirname, "../db/migrations")).filter((file) => file.endsWith(".sql")).sort();
  assert.deepEqual(history.map((row) => row.filename), files);
  assert.ok(history.every((row) => row.applied_at && Number.isFinite(Date.parse(row.applied_at))));
}

function assertRepeatSkips() {
  const before = historySnapshot();
  const result = applyMigrations(postgres.databaseUrl);
  assert.doesNotMatch(result.stdout, /^applied /m);
  assert.equal(historySnapshot(), before, "una repetición no debe cambiar el historial ni las fechas");
  assertHistory();
}

function verifyLegacyAdoption() {
  // Solo en el contenedor descartable creado por este script: simular una base
  // sin historial y con duplicados anteriores a la migración 003.
  postgres.query("drop table public.schema_migrations; drop index if exists reglas_agronomicas_unique_rule_idx;");
  postgres.query(`insert into reglas_agronomicas
    select (jsonb_populate_record(null::reglas_agronomicas,
      to_jsonb(r) || jsonb_build_object('id', gen_random_uuid(), 'clave', 'be002_duplicate', 'created_at', now() + interval '1 day'))).*
    from reglas_agronomicas r limit 1`);
  assert.notEqual(postgres.query(`select count(*) from (
    select 1 from reglas_agronomicas group by cultivo, categoria_nombre, condicion, regla_version having count(*) > 1
  ) duplicates`), "0");
  const result = applyMigrations(postgres.databaseUrl);
  assert.equal((result.stdout.match(/^applied db\/migrations\/003_/gm) || []).length, 1);
  assert.ok(result.stdout.indexOf("applied db/migrations/003_") < result.stdout.indexOf("applied db/migrations/001_"));
  assert.equal(postgres.query("select count(*) from reglas_agronomicas where clave = 'be002_duplicate'"), "0");
  assertHistory();
  assertRepeatSkips();
  console.log("legacy_adoption_ok");
}

function verifyFailureRollback() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "avizor-migrations-"));
  const migration = "004_reglas_estado_experimental.sql";
  const source = path.join(__dirname, "../db/migrations");
  try {
    fs.cpSync(source, path.join(fixture, "db/migrations"), { recursive: true });
    postgres.query(`delete from public.schema_migrations where filename = '${migration}'`);
    const before = historySnapshot();
    const original = fs.readFileSync(path.join(source, migration), "utf8");
    const target = path.join(fixture, "db/migrations", migration);
    fs.writeFileSync(target, `${original}\ncreate table be002_rollback_probe (id integer);\nselect be002_intentional_failure();\n`);
    const failed = applyMigrations(postgres.databaseUrl, { cwd: fixture, allowFailure: true });
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /migration_failed/);
    assert.equal(historySnapshot(), before, "no registrar una migración fallida");
    assert.equal(postgres.query("select to_regclass('public.be002_rollback_probe') is null"), "t");

    // También fallar al insertar el historial: el SQL de la migración debe
    // revertirse aunque haya terminado correctamente.
    fs.writeFileSync(target, `${original}\ncreate table be002_rollback_probe (id integer);\n`);
    postgres.query(`alter table public.schema_migrations add constraint be002_reject_history check (filename <> '${migration}')`);
    try {
      const failedInsert = applyMigrations(postgres.databaseUrl, { cwd: fixture, allowFailure: true });
      assert.notEqual(failedInsert.status, 0);
      assert.equal(historySnapshot(), before);
      assert.equal(postgres.query("select to_regclass('public.be002_rollback_probe') is null"), "t");
    } finally {
      postgres.query("alter table public.schema_migrations drop constraint be002_reject_history");
    }

    fs.writeFileSync(target, original);
    const retry = applyMigrations(postgres.databaseUrl, { cwd: fixture });
    assert.deepEqual(retry.stdout.split("\n").filter((line) => line.startsWith("applied ")), [`applied db/migrations/${migration}`]);
    assert.deepEqual(JSON.parse(historySnapshot()).filter((row) => row.filename !== migration), JSON.parse(before));
    assertHistory();
    assertRepeatSkips();
    console.log("failure_rollback_retry_ok");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

async function main() {
  console.log("comando_docker", postgres.command);
  await postgres.start();
  applyMigrations(postgres.databaseUrl);
  assertHistory();
  assertRepeatSkips();
  console.log("migration_history_repeat_ok");
  verifyLegacyAdoption();
  verifyFailureRollback();

  const schema = assertCleanSchema(readSchemaSnapshot(postgres.query));
  console.log("schema_ok", schema);
  console.log("contenedor_activo", postgres.container);
  console.log("para_borrar", `docker rm -f ${postgres.container}`);
}

main().catch((error) => {
  if (error instanceof CommandError && error.message) {
    console.error(error.message);
  } else {
    console.error(error.message || "clean_migration_failed");
  }
  process.exitCode = 1;
});
