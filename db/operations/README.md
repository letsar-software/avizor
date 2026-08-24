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
