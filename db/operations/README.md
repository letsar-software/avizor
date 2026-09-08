# Operaciones PostgreSQL

Para aplicar `db/migrations` de cero contra una instancia vacía: `npm run db:migrate:clean`.

Ese comando corre `scripts/test-clean-migrations.js`. Levanta el contenedor descartable `avizor-pg-migrate-test` (Postgres 16, puerto `54329`, usuario/clave/base `avizor`), aplica `scripts/apply-migrations.js` contra esa URL y valida el esquema. No lee el `DATABASE_URL` de Railway ni del `.env` local. El detalle está en el README, sección «Probar migraciones en PostgreSQL limpio».

# Operaciones PostgreSQL de seguridad

`railway_least_privilege_roles.sql` es un runbook manual, no una migración automática.

1. Crear dos credenciales LOGIN distintas y aleatorias en Railway/PostgreSQL.
2. Ejecutar el SQL como propietario en Preview/Staging.
3. Asociar el login de runtime a `avizor_app` y el login de migraciones a `avizor_migrations`.
4. Configurar `DATABASE_URL` de la aplicación con el login runtime.
5. Ejecutar `npm run db:migrate` únicamente con la URL del login de migraciones.
6. Verificar que `avizor_app` puede usar las APIs pero recibe `permission denied` para `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` y `CREATE ROLE`.
7. Repetir en producción y retirar las credenciales anteriores cuando el rollback window finalice.

El script no crea contraseñas, no transfiere ownership y no modifica el entorno real automáticamente.
