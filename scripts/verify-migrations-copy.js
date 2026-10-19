// Verifica las migraciones pendientes (030 → 031 → 032) sobre una COPIA de la base en
// un PostgreSQL descartable (Docker). Nunca usa DATABASE_URL del .env ni de Railway.
//
// Uso: node scripts/verify-migrations-copy.js <dump.pgdump> [reporte.md] [--keep]
//   1. Restaura el dump en un contenedor nuevo.
//   2. Lleva la copia hasta 029 con el runner (AVIZOR_MIGRATIONS_STOP_BEFORE=030; sólo la copia).
//   3. Simula 030–032 dos veces en una transacción revertida y escribe el reporte.
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");
const { runCommand } = require("./lib/run-command");
const { createDisposablePostgres } = require("./lib/disposable-postgres");
const { simulatePending, toMarkdownPending } = require("./lib/migration-031-impact");

const [dumpArg, reportArg] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const keep = process.argv.includes("--keep");
if (!dumpArg || !fs.existsSync(dumpArg)) {
  console.error("Uso: node scripts/verify-migrations-copy.js <dump.pgdump> [reporte.md] [--keep]");
  process.exit(1);
}

const postgres = createDisposablePostgres({
  container: "avizor-pg-copy-verify",
  image: "postgres:17", // el dump se generó con pg_dump 17
  user: "avizor",
  password: "avizor",
  database: "avizor",
  hostPort: "54331",
});

async function main() {
  await postgres.start();
  try {
    runCommand("docker", ["cp", path.resolve(dumpArg), `${postgres.container}:/tmp/copia.dump`]);
    const restore = runCommand(
      "docker",
      ["exec", postgres.container, "pg_restore", "--no-owner", "--no-acl", "-U", "avizor", "-d", "avizor", "/tmp/copia.dump"],
      { allowFailure: true, capture: true },
    );
    if (restore.status !== 0) console.warn(`pg_restore terminó con advertencias:\n${(restore.stderr || "").slice(0, 2000)}`);
    // Sin datos restaurados el reporte describiría una base vacía: se corta acá.
    const restored = postgres.query(
      "select to_regclass('public.consulta_logs') is not null and exists (select 1 from consulta_logs)",
    );
    if (restored !== "t") throw new Error("La copia no se restauró (sin consultas). Revisar la versión de pg_dump/pg_restore.");

    // Pone la copia al día hasta 029. 030–032 sólo se simulan abajo (ROLLBACK).
    runCommand(process.execPath, [path.join(__dirname, "apply-migrations.js")], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: postgres.databaseUrl, DATABASE_SSL: "false", NODE_ENV: "development", AVIZOR_MIGRATIONS_STOP_BEFORE: "030" },
    });

    const client = new Client({ connectionString: postgres.databaseUrl });
    await client.connect();
    try {
      const db = { query: async (sql) => (await client.query(sql)).rows, exec: (sql) => client.query(sql) };
      const result = await simulatePending(db);
      const markdown = toMarkdownPending(result, "Reporte de impacto — migraciones 030, 031 y 032 (copia restaurada)");
      if (reportArg) fs.writeFileSync(reportArg, markdown);
      else console.log(markdown);
      const persisted = await client.query("select to_regclass('public.migracion_031_vinculos') is null and to_regclass('public.lotes') is null and to_regclass('public.agronomic_advisories') is null as revertida");
      console.log(`simulacion_revertida=${persisted.rows[0].revertida} idempotente=${result.idempotente} existentes_sobrescritas=${result.categorias_existentes_modificadas.length}`);
    } finally {
      await client.end();
    }
  } finally {
    if (!keep) runCommand("docker", ["rm", "-f", postgres.container], { allowFailure: true, capture: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
