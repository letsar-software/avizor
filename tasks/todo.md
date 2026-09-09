# Tareas BE-002

- [x] Validar BE-001 antes del cambio.
  - Aceptación: 001–020 exitosas, 23 tablas y pgcrypto.
  - Verificar: `npm run db:migrate:clean`.
  - Archivos: ninguno.
- [x] Implementar historial y ejecución atómica.
  - Aceptación: 021 inicializa el historial, archivos registrados se omiten, 003 se aplica una sola vez.
  - Verificar: adopción sobre la base BE-001 y dos corridas consecutivas.
  - Archivos: `db/migrations/021_schema_migrations.sql`, `scripts/apply-migrations.js`.
- [x] Cubrir regresiones con PostgreSQL real.
  - Aceptación: base vacía, historial estable, deduplicación heredada y rollback/reintento verificados.
  - Verificar: `npm run db:migrate:clean`.
  - Archivos: `scripts/test-clean-migrations.js`, `scripts/lib/clean-schema.js`, `scripts/lib/run-command.js`.
- [x] Documentar y cerrar la verificación.
  - Aceptación: uso e historial documentados, resultados de pruebas registrados.
  - Verificar: `npm test`, `npm run lint`, `git diff --check`.
  - Archivos: `README.md`, `tasks/todo.md`.

## Evidencia — 2026-09-09

- Rama: `feat/be-002-schema-migrations-history`.
- BE-001 antes de modificar el ejecutor: 001–020 aplicadas, `active_soja_rules 13`, `schema_ok` con 23 tablas y pgcrypto.
- Adopción sobre esa misma base local: 21 archivos registrados; siguiente `npm run db:migrate` sin líneas `applied`.
- `npm run db:migrate:clean`: exit 0, `migration_history_repeat_ok`, `legacy_adoption_ok`, `failure_rollback_retry_ok`, `schema_ok` con 24 tablas y pgcrypto. Incluye fallos del SQL y del INSERT del historial, rollback, reintento y comparación exacta de timestamps.
- `npm test` no expande `tests/**/*.test.ts` con este entorno Node 20. Alternativa ejecutada: `node --import tsx --test tests/*.test.ts`, 176 tests aprobados, cero fallos.
- `npm run lint`: aprobado.
- Solo se utilizó PostgreSQL 16 local, contenedor descartable `avizor-pg-migrate-test`, puerto 54329. Se recrearon sus datos de prueba; queda activo para inspección. No se ejecutaron migraciones contra Railway.
