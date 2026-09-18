# Tareas INF-001

- [x] Crear la prueba de contrato de CI.
  - Aceptación: verifica trigger de PR, PostgreSQL efímero, comandos y orden.
  - Verificar: `node --import tsx --test tests/ci-workflow.test.ts` falla antes del workflow.
  - Archivos: `tests/ci-workflow.test.ts`.
- [x] Incorporar los comandos y runner E2E.
  - Aceptación: typecheck es portable; E2E migra únicamente la base temporal, inicia una app y ejecuta todos los scripts Python.
  - Verificar: `npm run typecheck`, `npm test`, `npm run test:e2e` con base temporal.
  - Archivos: `package.json`, `scripts/run-e2e-smoke.py`.
- [x] Crear workflow obligatorio de PR.
  - Aceptación: service PostgreSQL 16 aislado, Playwright Chromium y los cinco comandos en orden.
  - Verificar: prueba de contrato y lectura de `.github/workflows/ci.yml`.
  - Archivos: `.github/workflows/ci.yml`.
- [ ] Validar y documentar evidencia.
  - Aceptación: lint, tipos, build, tests, E2E y revisión de diffs correctos; ningún acceso a producción.
  - Verificar: comandos definidos en la especificación y `git diff --check`.
  - Archivos: `tasks/INF-001-todo.md`.

## Evidencia local — 2026-09-18

- `npm run lint`, `npm run typecheck`, `npm test` (177 pruebas) y `npm run build` finalizaron correctamente.
- `npm run db:migrate:clean` validó PostgreSQL 16 descartable: esquema de 24 tablas, repetición de migraciones y rollback/reintento.
- El runner E2E inicia una sola instancia de Next.js, ejecuta migraciones solo contra `127.0.0.1` y rechaza cualquier `DATABASE_URL` no local.
- La validación remota del workflow de PR queda como evidencia final pendiente.
