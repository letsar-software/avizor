// BE-001: aplica db/migrations de cero contra un PostgreSQL descartable.
// No usa DATABASE_URL del .env ni de Railway.
//
// Uso: npm run db:migrate:clean
const path = require("node:path");
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

function applyMigrations(databaseUrl) {
  runCommand(process.execPath, [path.join(__dirname, "apply-migrations.js")], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_SSL: "false",
      NODE_ENV: "development",
    },
  });
}

async function main() {
  console.log("comando_docker", postgres.command);
  await postgres.start();
  applyMigrations(postgres.databaseUrl);

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
